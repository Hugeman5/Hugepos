
import { promises as fs } from 'fs';
import path from 'path';
import { type Customer } from './data';

const dataDir = path.join(process.cwd(), 'data');
const customersPath = path.join(dataDir, 'customers.json');

async function readCustomers(): Promise<Customer[]> {
  try {
    await fs.access(customersPath);
    const data = await fs.readFile(customersPath, 'utf-8');
    return JSON.parse(data) as Customer[];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      await fs.writeFile(customersPath, '[]', 'utf-8');
      return [];
    }
    throw error;
  }
}

async function writeCustomers(data: Customer[]): Promise<void> {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(customersPath, JSON.stringify(data, null, 2), 'utf-8');
}

export async function getCustomers(): Promise<Customer[]> {
  return await readCustomers();
}

export async function getCustomer(id: string): Promise<Customer | null> {
  const customers = await readCustomers();
  return customers.find(c => c.id === id) || null;
}

export async function createOrUpdate(
  customerData: Partial<Customer> & { id?: string, name: string }
): Promise<Customer> {
  const customers = await readCustomers();
  const now = new Date().toISOString();
  
  if (customerData.id) {
    const index = customers.findIndex(c => c.id === customerData.id);
    if (index > -1) {
      const updatedCustomer = { ...customers[index], ...customerData, updatedAt: now };
      customers[index] = updatedCustomer;
      await writeCustomers(customers);
      return updatedCustomer;
    }
  }

  const newCustomer: Customer = {
    id: `cust_${Date.now()}`,
    points: 0,
    active: true,
    ...customerData,
    createdAt: now,
    updatedAt: now,
  };
  customers.unshift(newCustomer);
  await writeCustomers(customers);
  return newCustomer;
}

export async function deleteCustomer(id: string): Promise<void> {
    const customers = await readCustomers();
    const filtered = customers.filter(c => c.id !== id);
    if (filtered.length === customers.length) {
        throw new Error(`Customer with ID ${id} not found.`);
    }
    await writeCustomers(filtered);
}

export async function setPoints(id: string, pts: number): Promise<Customer> {
    const customers = await readCustomers();
    const index = customers.findIndex(c => c.id === id);
    if (index === -1) throw new Error("Customer not found");
    customers[index].points = pts;
    await writeCustomers(customers);
    return customers[index];
}

export async function incrementPoints(id: string, delta: number): Promise<Customer> {
    const customers = await readCustomers();
    const index = customers.findIndex(c => c.id === id);
    if (index === -1) throw new Error("Customer not found");
    customers[index].points = (customers[index].points || 0) + delta;
    await writeCustomers(customers);
    return customers[index];
}


export async function search(query: string, limit = 20): Promise<Customer[]> {
  const customers = await readCustomers();
  if (!query) {
    return customers.slice(0, limit);
  }
  const qLower = query.toLowerCase();
  const filtered = customers.filter(c => 
    c.name.toLowerCase().includes(qLower) ||
    c.email?.toLowerCase().includes(qLower) ||
    c.phone?.includes(qLower)
  );
  return filtered.slice(0, limit);
}
