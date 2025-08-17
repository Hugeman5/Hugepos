
import { promises as fs } from 'fs';
import path from 'path';

export type TaxCode = {
  code: string;
  name: string;
  rate: number;
  priceIncludesVAT: boolean;
};

export type Category = {
  id: string;
  name: string;
  color: string;
  active: boolean;
  sort: number;
};

export type MenuItem = {
  id: string;
  catId: string;
  name: string;
  sku?: string;
  priceCents: number;
  taxCode: string;
  active: boolean;
  sort: number;
  modifierSetIds?: string[];
};

export type ModifierOption = {
    id: string;
    name: string;
    priceDeltaCents: number;
    sort: number;
    sku?: string;
};

export type ModifierSet = {
    id: string;
    name: string;
    type: 'single' | 'multi';
    required: boolean;
    min: number;
    max: number;
    options: ModifierOption[];
    sort: number;
};


export type Menu = {
  categories: Category[];
  items: MenuItem[];
  modifierSets: ModifierSet[];
  taxCodes: TaxCode[];
  meta: {
    version: number;
    updatedAt: string;
  };
};

const PATH = path.join(process.cwd(), 'data', 'menu.json');

const defaultMenu: Menu = {
  categories: [],
  items: [],
  modifierSets: [],
  taxCodes: [
    { code: 'STD15', name: 'VAT 15%', rate: 0.15, priceIncludesVAT: true },
    { code: 'ZERO', name: 'Zero-rated', rate: 0.0, priceIncludesVAT: true },
  ],
  meta: { version: 1, updatedAt: new Date().toISOString() },
};

export async function getMenu(): Promise<Menu> {
  try {
    await fs.access(PATH);
    const data = await fs.readFile(PATH, 'utf-8');
    const menu = JSON.parse(data);
    // Ensure modifierSets exists for backward compatibility
    if (!menu.modifierSets) {
        menu.modifierSets = [];
    }
    return menu;
  } catch {
    await saveMenu(defaultMenu);
    return defaultMenu;
  }
}

export async function saveMenu(next: Menu): Promise<void> {
  await fs.mkdir(path.dirname(PATH), { recursive: true });
  next.meta.updatedAt = new Date().toISOString();
  await fs.writeFile(PATH, JSON.stringify(next, null, 2), 'utf-8');
}

function ensureUniqueId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}

function safeColor(color?: string): string {
  return color && /^#[0-9A-F]{6}$/i.test(color) ? color : '#5FB9A4';
}

// --- Category CRUD ---
export async function createCategory(name: string, color?: string): Promise<Category> {
  const menu = await getMenu();
  const newCategory: Category = {
    id: ensureUniqueId('cat'),
    name,
    color: safeColor(color),
    active: true,
    sort: (menu.categories.length + 1) * 10,
  };
  menu.categories.push(newCategory);
  await saveMenu(menu);
  return newCategory;
}

export async function updateCategory(id: string, patch: Partial<Omit<Category, 'id'>>): Promise<Category> {
  const menu = await getMenu();
  const index = menu.categories.findIndex(c => c.id === id);
  if (index === -1) throw new Error('Category not found');
  
  const updatedCategory = { ...menu.categories[index], ...patch };
  if(patch.color) updatedCategory.color = safeColor(patch.color);

  menu.categories[index] = updatedCategory;
  await saveMenu(menu);
  return updatedCategory;
}

export async function deleteCategory(id: string): Promise<void> {
  const menu = await getMenu();
  menu.categories = menu.categories.filter(c => c.id !== id);
  // Cascade delete items
  menu.items = menu.items.filter(i => i.catId !== id);
  await saveMenu(menu);
}

export async function sortCategories(orderedIds: string[]): Promise<void> {
  const menu = await getMenu();
  menu.categories.forEach(cat => {
    const index = orderedIds.indexOf(cat.id);
    cat.sort = (index + 1) * 10;
  });
  await saveMenu(menu);
}

// --- Item CRUD ---
export async function upsertItem(itemData: Partial<MenuItem> & {name: string, catId: string, priceCents: number}): Promise<MenuItem> {
  const menu = await getMenu();
  
  // Validate modifierSetIds
  if (itemData.modifierSetIds) {
      for (const modId of itemData.modifierSetIds) {
          if (!menu.modifierSets.some(ms => ms.id === modId)) {
              throw new Error(`Invalid modifierSetId: ${modId}`);
          }
      }
  }

  if (itemData.id) { // Update
    const index = menu.items.findIndex(i => i.id === itemData.id);
    if (index === -1) throw new Error('Item not found for update');
    menu.items[index] = { ...menu.items[index], ...itemData };
    await saveMenu(menu);
    return menu.items[index];
  } else { // Create
    const newItem: MenuItem = {
      id: ensureUniqueId('it'),
      taxCode: 'STD15',
      active: true,
      sort: (menu.items.filter(i => i.catId === itemData.catId).length + 1) * 10,
      ...itemData,
    };
    menu.items.push(newItem);
    await saveMenu(menu);
    return newItem;
  }
}

export async function deleteItem(id: string): Promise<void> {
  const menu = await getMenu();
  menu.items = menu.items.filter(i => i.id !== id);
  await saveMenu(menu);
}

export async function sortItems(catId: string, orderedIds: string[]): Promise<void> {
    const menu = await getMenu();
    menu.items.forEach(item => {
        if(item.catId === catId) {
            const index = orderedIds.indexOf(item.id);
            if(index > -1) {
                item.sort = (index + 1) * 10;
            }
        }
    });
    await saveMenu(menu);
}

// --- Modifier Set CRUD ---
export async function listModifierSets(): Promise<ModifierSet[]> {
    const menu = await getMenu();
    return menu.modifierSets.sort((a,b) => a.sort - b.sort);
}

export async function getModifierSet(id: string): Promise<ModifierSet | null> {
    const menu = await getMenu();
    return menu.modifierSets.find(ms => ms.id === id) || null;
}

export async function createModifierSet(data: Pick<ModifierSet, 'name' | 'type' | 'required' | 'min' | 'max'>): Promise<ModifierSet> {
    const menu = await getMenu();
    const newSet: ModifierSet = {
        id: ensureUniqueId('mods'),
        ...data,
        options: [],
        sort: (menu.modifierSets.length + 1) * 10,
    };
    menu.modifierSets.push(newSet);
    await saveMenu(menu);
    return newSet;
}

export async function updateModifierSet(id: string, patch: Partial<Omit<ModifierSet, 'id' | 'options'>>): Promise<ModifierSet> {
    const menu = await getMenu();
    const index = menu.modifierSets.findIndex(ms => ms.id === id);
    if (index === -1) throw new Error('ModifierSet not found');

    const updatedSet = { ...menu.modifierSets[index], ...patch };
    menu.modifierSets[index] = updatedSet;
    await saveMenu(menu);
    return updatedSet;
}

export async function deleteModifierSet(id: string): Promise<void> {
    const menu = await getMenu();
    menu.modifierSets = menu.modifierSets.filter(ms => ms.id !== id);
    // Also remove from any items that use it
    menu.items.forEach(item => {
        if (item.modifierSetIds) {
            item.modifierSetIds = item.modifierSetIds.filter(modId => modId !== id);
        }
    });
    await saveMenu(menu);
}

export async function sortModifierSets(orderedIds: string[]): Promise<void> {
  const menu = await getMenu();
  menu.modifierSets.forEach(set => {
    const index = orderedIds.indexOf(set.id);
    set.sort = (index + 1) * 10;
  });
  await saveMenu(menu);
}


// --- Modifier Option CRUD ---
export async function addModifierOption(setId: string, data: Pick<ModifierOption, 'name' | 'priceDeltaCents' | 'sku'>): Promise<ModifierOption> {
    const menu = await getMenu();
    const set = menu.modifierSets.find(ms => ms.id === setId);
    if (!set) throw new Error("ModifierSet not found");
    
    const newOption: ModifierOption = {
        id: ensureUniqueId('opt'),
        ...data,
        sort: (set.options.length + 1) * 10,
    };
    set.options.push(newOption);
    await saveMenu(menu);
    return newOption;
}

export async function updateModifierOption(setId: string, optionId: string, patch: Partial<Omit<ModifierOption, 'id'>>): Promise<ModifierOption> {
    const menu = await getMenu();
    const set = menu.modifierSets.find(ms => ms.id === setId);
    if (!set) throw new Error("ModifierSet not found");
    
    const optionIndex = set.options.findIndex(opt => opt.id === optionId);
    if (optionIndex === -1) throw new Error("ModifierOption not found");
    
    const updatedOption = { ...set.options[optionIndex], ...patch };
    set.options[optionIndex] = updatedOption;
    await saveMenu(menu);
    return updatedOption;
}

export async function removeModifierOption(setId: string, optionId: string): Promise<void> {
    const menu = await getMenu();
    const set = menu.modifierSets.find(ms => ms.id === setId);
    if (!set) throw new Error("ModifierSet not found");

    set.options = set.options.filter(opt => opt.id !== optionId);
    await saveMenu(menu);
}

export async function sortModifierOptions(setId: string, orderedIds: string[]): Promise<void> {
  const menu = await getMenu();
  const set = menu.modifierSets.find(ms => ms.id === setId);
  if (!set) throw new Error("ModifierSet not found");

  set.options.forEach(opt => {
    const index = orderedIds.indexOf(opt.id);
    opt.sort = (index + 1) * 10;
  });
  await saveMenu(menu);
}
