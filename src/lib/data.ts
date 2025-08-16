
export type User = {
  id: number;
  name: string;
  role: 'Admin' | 'Cashier' | 'Waiter' | 'Kitchen';
  pin?: string;
  email?: string;
  username?: string;
  active: boolean;
};

// --- CATALOG ---
export type Tax = {
  id: string;
  name: string;
  rate: number;
  inclusive: boolean;
};

export type Category = {
  id: string;
  name: string;
};

export type Product = {
  id: string;
  name: string;
  categoryId: string;
  price: number;
  taxId: string;
  active: boolean;
  modifierIds?: string[];
  imageUrl?: string;
};

export type ModifierOption = {
  id: string;
  name: string;
  delta: number;
};

export type Modifier = {
  id: string;
  name: string;
  type: 'choice' | 'count';
  options?: ModifierOption[]; // For 'choice'
  step?: number; // For 'count'
  deltaPerUnit?: number; // For 'count'
  max?: number; // For 'count'
};

// --- ORDER ---
export type OrderItem = {
  product: Product;
  quantity: number;
};

export type Order = {
  id: string;
  tableNumber?: number;
  status: 'pending' | 'completed' | 'paid';
  items: OrderItem[];
  createdAt: Date;
  total: number;
};


// --- CART (Client-side) ---
export type CartLineMod = {
    id: string; // modifierId
    optionId?: string; // For choice
    count?: number; // For count
};

export type CartLine = {
    id: string; // A unique ID for this specific line in the cart
    productId: string;
    qty: number;
    mods: CartLineMod[];
    // These fields are calculated by the backend for display
    productName?: string;
    modsSummary?: string;
    subtotal: number;
    tax: number;
    total: number;
};

export type Cart = {
    lines: CartLine[];
};

export type OrderTotal = {
    subtotal: number;
    tax: number;
    total: number;
}


// --- INVENTORY ---
export type Ingredient = {
  id: string; // e.g. "coffee-beans"
  name: string; // e.g. "Coffee Beans"
  unit: 'g' | 'ml' | 'ea';
  costPerUnit: number; // cost for 1 'unit'
};

export type RecipeItem = {
  ingredientId: string;
  quantity: number;
};

export type Recipe = {
  productId: string;
  items: RecipeItem[];
};

export type InventoryItem = {
  ingredientId: string;
  onHand: number;
  reorderPoint: number;
};

export type InventoryMove = {
  id: string;
  timestamp: string;
  ingredientId: string;
  quantity: number; // can be negative
  type: 'sale' | 'receive' | 'adjust';
  note?: string;
  user?: string;
  ref?: string; // e.g. order.id
};

// --- MOCK DATA (Legacy) ---
// This is being phased out in favor of /data JSON files
export const orders: Order[] = [
  {
    id: 'ORD001',
    tableNumber: 5,
    status: 'pending',
    items: [
      { product: { id: 'latte', name: 'Latte', categoryId: 'coffee', price: 3.50, taxId: 'vat15', active: true }, quantity: 1 },
    ],
    createdAt: new Date(Date.now() - 5 * 60 * 1000), // 5 mins ago
    total: 3.50
  },
];
