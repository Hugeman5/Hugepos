export type User = {
  id: number;
  name: string;
  role: 'Admin' | 'Cashier' | 'Waiter' | 'Kitchen';
  pin?: string;
  email?: string;
  username?: string;
  active: boolean;
};

export type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  imageUrl: string;
  dataAiHint: string;
};

export type Category = {
  id: number;
  name: string;
};

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

export const users: User[] = [
  { id: 1, name: 'Admin User', role: 'Admin', email: 'admin@hugepos.com', username: 'admin', active: true },
  { id: 2, name: 'John Cashier', role: 'Cashier', pin: '1234', active: true },
  { id: 3, name: 'Jane Waiter', role: 'Waiter', pin: '5678', active: true },
  { id: 4, name: 'Chef Mike', role: 'Kitchen', pin: '9876', active: true },
  { id: 5, name: 'Inactive User', role: 'Cashier', pin: '0000', active: false },
];

export const categories: Category[] = [
  { id: 1, name: 'Burgers' },
  { id: 2, name: 'Sides' },
  { id: 3, name: 'Drinks' },
  { id: 4, name: 'Desserts' },
];

export const products: Product[] = [
  { id: 1, name: 'Classic Burger', category: 'Burgers', price: 12.99, stock: 50, imageUrl: 'https://placehold.co/300x200.png', dataAiHint: 'classic burger' },
  { id: 2, name: 'Cheese Burger', category: 'Burgers', price: 14.50, stock: 40, imageUrl: 'https://placehold.co/300x200.png', dataAiHint: 'cheese burger' },
  { id: 3, name: 'Vegan Burger', category: 'Burgers', price: 15.99, stock: 25, imageUrl: 'https://placehold.co/300x200.png', dataAiHint: 'vegan burger' },
  { id: 4, name: 'French Fries', category: 'Sides', price: 4.99, stock: 100, imageUrl: 'https://placehold.co/300x200.png', dataAiHint: 'french fries' },
  { id: 5, name: 'Onion Rings', category: 'Sides', price: 5.50, stock: 80, imageUrl: 'https://placehold.co/300x200.png', dataAiHint: 'onion rings' },
  { id: 6, name: 'Cola', category: 'Drinks', price: 2.50, stock: 200, imageUrl: 'https://placehold.co/300x200.png', dataAiHint: 'cola can' },
  { id: 7, name: 'Lemonade', category: 'Drinks', price: 2.75, stock: 150, imageUrl: 'https://placehold.co/300x200.png', dataAiHint: 'lemonade glass' },
  { id: 8, name: 'Water', category: 'Drinks', price: 1.50, stock: 300, imageUrl: 'https://placehold.co/300x200.png', dataAiHint: 'water bottle' },
  { id: 9, name: 'Chocolate Cake', category: 'Desserts', price: 7.99, stock: 30, imageUrl: 'https://placehold.co/300x200.png', dataAiHint: 'chocolate cake' },
  { id: 10, name: 'Ice Cream', category: 'Desserts', price: 4.99, stock: 60, imageUrl: 'https://placehold.co/300x200.png', dataAiHint: 'ice cream' },
];

export const orders: Order[] = [
    {
        id: 'ORD001',
        tableNumber: 5,
        status: 'pending',
        items: [
            { product: products[0], quantity: 1 },
            { product: products[1], quantity: 1 },
            { product: products[3], quantity: 2 },
            { product: products[6], quantity: 2 },
        ],
        createdAt: new Date(Date.now() - 5 * 60 * 1000), // 5 mins ago
        total: 40.46
    },
    {
        id: 'ORD002',
        tableNumber: 12,
        status: 'pending',
        items: [
            { product: products[2], quantity: 1 },
            { product: products[4], quantity: 1 },
        ],
        createdAt: new Date(Date.now() - 2 * 60 * 1000), // 2 mins ago
        total: 21.49
    },
    {
        id: 'ORD003',
        status: 'pending',
        items: [
            { product: products[8], quantity: 1 },
        ],
        createdAt: new Date(Date.now() - 1 * 60 * 1000), // 1 min ago
        total: 7.99
    },
];
