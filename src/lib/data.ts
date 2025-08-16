




export type User = {
  id: string;
  name: string;
  role: 'admin' | 'manager' | 'cashier' | 'waiter' | 'kitchen';
  pin?: string;
  email?: string;
  username?: string;
  active: boolean;
  exposeOnPinLogin: boolean;
  outlets?: string[];
};

export type RolePermissionValue = boolean | string | number;

export type Role = {
  editable: boolean;
  permissions: Record<string, RolePermissionValue>;
};

export type RolesMatrix = {
  admin: Role;
  manager: Role;
  cashier: Role;
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
  id: string; // SKU
  name: string;
  categoryId: string;
  price: number;
  taxId: string;
  active: boolean;
  modifierIds?: string[];
  imageUrl?: string;
  // New fields for import/export
  barcode?: string;
  plu?: string;
  stationId?: string; // Prep station override
  cost?: number;
  cogsGroup?: string;
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
  required?: boolean;
  min?: number;
  max?: number;
  options?: ModifierOption[]; // For 'choice'
  step?: number; // For 'count'
  deltaPerUnit?: number; // For 'count'
};

// --- MENU SCREENS ---
export type MenuScreenItem = {
    productId: string; // SKU
    position: number;
}
export type MenuScreenSection = {
    id: string;
    name: string;
    items: MenuScreenItem[];
}
export type MenuScreen = {
    id:string;
    name: string;
    sections: MenuScreenSection[];
}
export type MenuLayout = MenuScreen[];

// --- PRICE LISTS ---
export type PriceListInstruction = {
    productId: string; // SKU
    price: number;
}
export type PriceList = {
    id: string;
    name: string;
    instructions: PriceListInstruction[];
}

// --- ORDER ---
export type OrderStatus = 'DRAFT' | 'PAID' | 'VOID' | 'PENDING' | 'COMPLETED';
export type PrepStatus = 'queued' | 'in_progress' | 'done';

export type OrderLineMod = {
  id: string;
  name: string;
  delta: number;
  optionId?: string;
  count?: number;
};

export type SeatLine = { lineId:string; seatNo:number }

export type OrderLine = {
  id: string; // This is the CartLine ID, not stable across orders
  lineId: string; // This is the stable, unique ID for this line item instance
  productId: string;
  name:string;
  qty: number;
  unitPrice: number;
  mods?: OrderLineMod[];
  lineTotal: number;
  prep: {
      stationId: string;
      status: PrepStatus;
  }
};

export type Order = {
  id: string;
  number: number;
  ts: string;
  user: { uid: string; name: string };
  status: OrderStatus;
  lines: OrderLine[];
  totals: { subtotal: number; tax: number; total: number };
  notes?: string;
  shiftId?: string;
  service?: { 
    type: "dine_in", 
    tableId: string, 
    checkId: string, 
    seatMap?: SeatLine[] 
  }
};

// --- PAYMENT ---
export type Payment = {
  id: string;
  ts: string;
  orderId: string;
  type: 'cash' | 'card';
  amount: number;
  change?: number;
  last4?: string;
  user: { uid: string; name: string };
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

// --- KDS ---
export type Station = {
  id: string;
  name: string;
};

export type RoutingRules = {
  defaultStation: string;
  byProduct: Record<string, string>;
  byCategory: Record<string, string>;
};

export type KdsTicketItem = {
  lineId: string;
  name: string;
  qty: number;
  status: PrepStatus;
  mods: OrderLineMod[];
};

export type KdsTicket = {
  orderId: string;
  number: number;
  createdAt: string;
  items: KdsTicketItem[];
};

// --- REGISTERS & SHIFTS ---
export type Register = {
  id: string;
  name: string;
};

export type ShiftStatus = 'open' | 'closed';

export type Shift = {
  id: string; // e.g., shift_1
  registerId: string;
  userIdOpen: string;
  userNameOpen: string;
  tsOpen: string;
  floatAmount: number;
  status: ShiftStatus;
  
  // These are added on close
  tsClose?: string;
  userIdClose?: string;
  userNameClose?: string;
  cashPayments?: number;
  cashExpected?: number;
  cashActual?: number;
  cashDifference?: number;
  cardPayments?: number;
};

export type CashMovement = {
  id: string;
  shiftId: string;
  type: 'payin' | 'payout';
  amount: number;
  reason: string;
  ts: string;
  userId: string;
  userName: string;
};

export type RegisterReport = {
  id: string; // report_shift_1
  shiftId: string;
  ts: string;
  
  // Summary
  salesTotal: number;
  taxTotal: number;
  netSales: number;
  
  // Payments
  cashPaymentsTotal: number;
  cardPaymentsTotal: number;
  
  // Cash Drawer
  startingFloat: number;
  cashIn: number;
  cashOut: number;
  cashSales: number;
  expectedInDrawer: number;
  actualInDrawer: number;
  difference: number;
  
  // Details
  orders: number[];
  payments: Payment[];
  cashMovements: CashMovement[];
};


// --- TABLE SERVICE ---
export type Area = {
  id: string;
  name: string;
  color: string;
  order: number;
};

export type TableShape = 'square' | 'round';

export type Table = {
  id: string;
  areaId: string;
  name: string;
  seats: number;
  x: number;
  y: number;
  shape: TableShape;
};

export type FloorPlan = {
  areas: Area[];
  tables: Table[];
};

export type TableState = "free"|"seated"|"ordering"|"fired"|"served"|"bill"|"dirty";

export type ServiceCheck = {
  id:string; 
  tableId:string; 
  areaId:string; 
  guests:number;
  server:{uid:string;name:string};
  openedAt:string; 
  closedAt?:string;
  orderId:string; // current working draft order id
  state:TableState;
  seats:number;
  seatMap?: SeatLine[];
  splits?: Array<{ id:string; name:string; orderId:string }>;
};

export type Transfer = {
  id: string;
  ts: string;
  checkId: string;
  fromUserId: string;
  toUserId: string;
};
