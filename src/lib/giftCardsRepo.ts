

import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { GiftCard, GiftCardSettings, GiftCardTxn } from './data';

const dataDir = path.join(process.cwd(), 'data');
const settingsPath = path.join(dataDir, 'gift_card_settings.json');
const cardsPath = path.join(dataDir, 'gift_cards.json');
const txnsPath = path.join(dataDir, 'gift_card_txns.json');

const defaultSettings: GiftCardSettings = {
    prefix: "HUGE",
    codeLength: 12,
    expiryMonths: 24,
    allowManualCode: true,
    currency: "USD"
};

async function readJSONFile<T>(filePath: string, defaultValue: T): Promise<T> {
    try {
        await fs.access(filePath);
        const data = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            await fs.writeFile(filePath, JSON.stringify(defaultValue, null, 2), 'utf-8');
            return defaultValue;
        }
        throw error;
    }
}

async function writeJSONFile<T>(filePath: string, data: T): Promise<void> {
    await fs.mkdir(dataDir, { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export async function getSettings(): Promise<GiftCardSettings> {
    return readJSONFile<GiftCardSettings>(settingsPath, defaultSettings);
}

export async function saveSettings(settings: GiftCardSettings): Promise<void> {
    await writeJSONFile(settingsPath, settings);
}

async function readAllCards(): Promise<GiftCard[]> {
    return readJSONFile<GiftCard[]>(cardsPath, []);
}

async function saveAllCards(cards: GiftCard[]): Promise<void> {
    await writeJSONFile(cardsPath, cards);
}

async function readAllTxns(): Promise<GiftCardTxn[]> {
    return readJSONFile<GiftCardTxn[]>(txnsPath, []);
}

async function saveAllTxns(txns: GiftCardTxn[]): Promise<void> {
    await writeJSONFile(txnsPath, txns);
}

async function addTxn(txn: Omit<GiftCardTxn, 'id' | 'ts'>): Promise<GiftCardTxn> {
    const txns = await readAllTxns();
    const newTxn: GiftCardTxn = {
        ...txn,
        id: `gctxn_${Date.now()}`,
        ts: new Date().toISOString()
    };
    txns.unshift(newTxn);
    await saveAllTxns(txns);
    return newTxn;
}

export async function getCard(code: string): Promise<GiftCard | null> {
    const cards = await readAllCards();
    return cards.find(c => c.code === code) || null;
}

export async function upsertCard(cardData: Partial<GiftCard> & { code: string }): Promise<GiftCard> {
    const cards = await readAllCards();
    const index = cards.findIndex(c => c.code === cardData.code);
    if (index > -1) {
        cards[index] = { ...cards[index], ...cardData };
    } else {
        cards.unshift(cardData as GiftCard);
    }
    await saveAllCards(cards);
    return cards.find(c => c.code === cardData.code)!;
}

export async function generateCode(prefix: string, length: number): Promise<string> {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = prefix;
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

export async function issue(data: { amount: number; code?: string; customerId?: string; orderId?: string; notes?: string; user?: { uid: string, name: string } }): Promise<GiftCard> {
    const settings = await getSettings();
    let cardCode = data.code;
    if (!cardCode) {
        let isUnique = false;
        while(!isUnique) {
            cardCode = await generateCode(settings.prefix, settings.codeLength);
            const existing = await getCard(cardCode);
            if (!existing) isUnique = true;
        }
    } else {
        const existing = await getCard(cardCode);
        if (existing) throw new Error("A gift card with this code already exists.");
    }
    
    const now = new Date();
    const expires = new Date(now);
    expires.setMonth(now.getMonth() + settings.expiryMonths);

    const newCard: GiftCard = {
        code: cardCode,
        status: 'active',
        balance: data.amount,
        currency: settings.currency,
        issuedAt: now.toISOString(),
        expiresAt: expires.toISOString(),
        customerId: data.customerId,
        orderId: data.orderId,
        notes: data.notes,
        lastTxAt: now.toISOString()
    };
    
    await upsertCard(newCard);
    await addTxn({
        code: newCard.code,
        type: 'issue',
        amount: data.amount,
        orderId: data.orderId,
        user: data.user,
        note: "Initial issue"
    });
    
    return newCard;
}

export async function redeem(data: { code: string; amount: number; orderId: string; user?: { uid: string, name: string } }): Promise<{ card: GiftCard; txn: GiftCardTxn }> {
    if (data.amount <= 0) throw new Error("Redemption amount must be positive.");
    
    const card = await getCard(data.code);
    if (!card) throw new Error("Gift card not found.");
    if (card.status !== 'active') throw new Error(`Card is not active (status: ${card.status}).`);
    if (card.balance < data.amount) throw new Error(`Insufficient balance. Available: ${card.balance}, trying to redeem: ${data.amount}.`);
    
    card.balance -= data.amount;
    card.lastTxAt = new Date().toISOString();
    
    const txn = await addTxn({
        code: data.code,
        type: 'redeem',
        amount: -data.amount,
        orderId: data.orderId,
        user: data.user
    });
    
    await upsertCard(card);
    
    return { card, txn };
}

export async function refund(data: { code: string; amount: number; orderId: string; user?: { uid: string, name: string } }): Promise<{ card: GiftCard; txn: GiftCardTxn }> {
     if (data.amount <= 0) throw new Error("Refund amount must be positive.");
    
    const card = await getCard(data.code);
    if (!card) throw new Error("Gift card not found.");
    
    card.balance += data.amount;
    card.lastTxAt = new Date().toISOString();
    
    const txn = await addTxn({
        code: data.code,
        type: 'refund',
        amount: data.amount,
        orderId: data.orderId,
        user: data.user
    });
    
    await upsertCard(card);
    
    return { card, txn };
}


export async function ledger(code: string, limit = 200): Promise<GiftCardTxn[]> {
    const txns = await readAllTxns();
    return txns.filter(t => t.code === code).slice(0, limit);
}

export async function listCards(query: { q?: string; status?: string; limit?: number } = {}): Promise<GiftCard[]> {
    let cards = await readAllCards();
    if (query.status) {
        cards = cards.filter(c => c.status === query.status);
    }
    if (query.q) {
        const qLower = query.q.toLowerCase();
        cards = cards.filter(c => c.code.toLowerCase().includes(qLower) || c.customerId?.toLowerCase().includes(qLower));
    }
    return cards.slice(0, query.limit || 50);
}
