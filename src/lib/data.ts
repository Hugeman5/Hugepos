

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
  hourlyRate?: number;
  overtimeRate?: number;
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


// --- CATALOG (Legacy, see menuRepo for new structure) ---
export type Tax = {
  id: string;
  name: string;
  rate: number;
};

// --- ORDER ---
export type OrderStatus = 'DRAFT' | 'PAID' | 'VOID' | 'PENDING' | 'COMPLETED';
export type PrepStatus = 'queued' | 'in_progress' | 'done';

export type OrderLineMod = {
  setId: string;
  setName: string;
  optionId: string;
  optionName: string;
  deltaCents: number;
};

export type SeatLine = { lineId:string; seatNo:number }

export type OrderLine = {
  id: string; // This is the CartLine ID, not stable across orders
  lineId: string; // This is the stable, unique ID for this line item instance
  productId: string;
  name:string;
  qty: number;
  unitPrice: number; // in cents
  mods: OrderLineMod[];
  lineTotal: number; // in cents
  prep: {
      stationId: string;
      status: PrepStatus;
  }
};

export type AppliedDiscount = {
    ruleId: string;
    name: string;
    scope: 'item' | 'category' | 'order';
    amountCents: number;
    lines: string[]; // lineIds this discount applies to
}

export type Order = {
  id: string;
  number: number;
  ts: string;
  user: { uid: string; name: string };
  status: OrderStatus;
  lines: OrderLine[];
  totals: OrderTotal;
  discounts?: AppliedDiscount[];
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
  type: 'cash' | 'card' | 'gift_card';
  amount: number;
  change?: number;
  last4?: string;
  ref?: string; // e.g. gift card code
  user: { uid: string; name: string };
  amountRounded?: number;
  cashStep?: number;
};


// --- CART (Client-side) ---
export type CartLineMod = {
    setId: string;
    optionIds: string[];
};

export type CartLine = {
    id: string; // A unique ID for this specific line in the cart
    lineId: string; // The permanent ID for this line
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
    customerId?: string;
    pointsToRedeem?: number;
};

export type OrderTotal = {
    subtotal: number;
    tax: number;
    total: number;
    discount?: number;
}


// --- INVENTORY ---
export type Ingredient = {
  id: string;
  name: string;
  purchaseUom: "g"|"kg"|"ml"|"l"|"ea";
  
  // Purchase info (single source of truth from supplier catalog or manual entry)
  purchaseSize: number;
  priceExVat?: number;
  priceIncVat: number;
  vatRate?: number;
  
  // computed convenience
  unitCostExVat?: number;
  unitCostIncVat?: number;
  
  // source linkage
  source?: "supplier" | "manual";
  supplierId?: string;
  supplierItemId?: string;
  sku?: string;
};

export type RecipeBomRow = {
  ingredientId: string;
  qty: number;
  uom: string;
  wastePct?: number;
};

export type Recipe = {
  id:string; name:string; bom:RecipeBomRow[];
  yieldPortions:number; overheadPct:number; packagingCost:number; targetGpPct:number;
};

export type RecipeLink = {
  itemId: string;
  recipeId: string;
};

export type RecipesFile = {
  recipes: Recipe[];
  links: RecipeLink[];
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

export type KdsTicketLine = {
  name: string;
  qty: number;
  mods?: string;
};

export type KdsTicket = {
  id: string;
  orderId: string;
  table: string;
  station: string;
  createdAt: string;
  expedite: boolean;
  status: 'queued' | 'done';
  doneAt?: string;
  lines: KdsTicketLine[];
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
  giftCardPayments?: number;
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
  giftCardPaymentsTotal: number;
  
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

export type Decor = {
  id: string;
  asset: 'plant' | 'bar' | string;
  x: number;
  y: number;
  width?: number;
  height?: number;
}

export type FloorPlan = {
  areas: Area[];
  tables: Table[];
  decor?: Decor[];
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

// --- CUSTOMERS & LOYALTY ---
export type Customer = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  groupId?: string;
  points?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  active: boolean;
};

export type CustomerGroup = {
  id: string;
  name: string;
  discountPct?: number;
};

export type LoyaltyRules = {
  earn: { pointsPerCurrency: number };
  redeem: { pointsPerCurrency: number };
  maxRedeemPct: number;
  autoEnroll: boolean;
};

export type LedgerEntry = {
  id: string;
  ts: string;
  customerId: string;
  type: 'earn' | 'redeem' | 'adjust';
  points: number; // positive for earn, negative for redeem
  orderId?: string;
  value?: number; // monetary value of redemption
  note?: string;
};


// --- GIFT CARDS ---
export type GiftCardSettings = {
  prefix: string;
  codeLength: number;
  expiryMonths: number;
  allowManualCode: boolean;
  currency: string;
};

export type GiftCard = {
  code: string;
  status: "active" | "inactive" | "suspended";
  balance: number;
  currency: string;
  issuedAt: string;
  expiresAt?: string;
  customerId?: string;
  orderId?: string; // Original order ID where it was issued
  notes?: string;
  lastTxAt?: string;
};

export type GiftCardTxn = {
  id: string;
  code: string;
  ts: string;
  type: "issue" | "redeem" | "refund" | "void" | "adjust";
  amount: number; // Can be positive or negative
  orderId?: string;
  lineId?: string;
  user?: { uid: string, name: string };
  note?: string;
};

// --- HARDWARE ---
export type Printer = {
  id: string;
  name: string;
  kind: 'receipt' | 'kitchen';
  driver: 'html' | 'escpos'; // for now, only html
  enabled: boolean;
  widthChars?: number;
  stations?: string[]; // for kitchen printers
};

export type CashDrawer = {
  id: string;
  name: string;
  registerId: string;
  driver: 'mock' | 'serial';
  enabled: boolean;
};

export type Scanner = {
  id: string;
  name: string;
  mode: 'keyboard' | 'serial';
  enabled: boolean;
};

export type DeviceConfig = {
  printers: Printer[];
  drawers: CashDrawer[];
  scanners: Scanner[];
};

export type PrintJob = {
  id: string;
  ts: string;
  type: 'receipt' | 'kitchen' | 'test';
  status: 'queued' | 'rendered' | 'error';
  deviceId: string;
  payload: Record<string, any>;
  outputPath?: string;
  error?: string;
};

export type DeviceEvent = {
  id: string;
  ts: string;
  deviceId: string;
  type: 'drawer_open' | 'print_ok' | 'print_err' | 'scan';
  payload?: any;
};

export type EmailOutboxItem = {
    id: string;
    ts: string;
    to: string;
    subject: string;
    htmlPath: string;
    status: 'queued' | 'sent' | 'error';
    error?: string;
};


// --- PROMOTIONS ---
export type PromotionRule = {
    id: string;
    name: string;
    type: 'percent' | 'amount' | 'bxgy';
    value: number; // For percent or fixed amount in cents
    scope: 'item' | 'category' | 'order';
    targetIds: string[]; // Product or Category IDs
    bxgy: {
        buyQty: number;
        getQty: number;
        appliesTo: 'same' | 'different'; // For BxGy, specifies if the free item is the same or a different one
    };
    active: boolean;
    time: {
        days: number[]; // 0=Sun, 1=Mon, ...
        start: string; // "HH:MM"
        end: string; // "HH:MM"
        tz: string; // Timezone e.g., "Africa/Johannesburg"
    };
    eligibility: {
        roles: Array<User['role']>;
        minSpendCents: number;
        minQty: number;
    };
    stacking: 'exclusive' | 'compatible';
}
