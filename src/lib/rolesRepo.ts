

import { promises as fs } from 'fs';
import path from 'path';
import { type RolesMatrix, type Role, type RolePermissionValue } from './data';

const dataDir = path.join(process.cwd(), 'data');
const rolesPath = path.join(dataDir, 'roles.json');


const defaultRoles: RolesMatrix = {
  admin: {
    editable: false,
    permissions: { "setup.manage_users": true }
  },
  manager: {
    editable: true,
    permissions: { "setup.manage_users": true }
  },
  cashier: {
    editable: true,
    permissions: { "sell.enabled": true }
  },
};


async function readJSONFile<T>(filePath: string, defaultValue: T): Promise<T> {
  try {
    await fs.mkdir(dataDir, { recursive: true });
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      await writeJSONFile(filePath, defaultValue);
      return defaultValue;
    }
    console.error(`Error reading ${filePath}:`, error);
    throw error;
  }
}

async function writeJSONFile<T>(filePath: string, data: T): Promise<void> {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}


export async function getAllRoles(): Promise<RolesMatrix> {
  return readJSONFile<RolesMatrix>(rolesPath, defaultRoles);
}


export async function saveRoles(newRoles: RolesMatrix): Promise<void> {
  const currentRoles = await getAllRoles();
  
  // Only update roles that are marked as editable
  const updatedRoles: RolesMatrix = {
      admin: currentRoles.admin, // Admin role is never editable from API
      manager: newRoles.manager.editable ? newRoles.manager : currentRoles.manager,
      cashier: newRoles.cashier.editable ? newRoles.cashier : currentRoles.cashier
  };

  await writeJSONFile(rolesPath, updatedRoles);
}


export async function hasPermission(roleName: keyof RolesMatrix, permission: string): Promise<boolean> {
    const roles = await getAllRoles();
    const role = roles[roleName];
    if (!role) {
        return false;
    }
    const permissionValue = role.permissions[permission];

    // For now, any truthy value means permission is granted.
    // This could be expanded to handle strings like 'self_only'.
    return !!permissionValue;
}
