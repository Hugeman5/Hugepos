
'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { type RolesMatrix } from '@/lib/data';

type PermissionKey = keyof RolesMatrix['cashier']['permissions'];

const permissionGroups = {
    "Discounts": [
        "discounts.allow_line", "discounts.allow_sale", "discounts.line_max_pct", "discounts.sale_max_pct"
    ],
    "Selling": [
        "sell.enabled", "sell.on_account", "sell.layby", "sell.park_sale", "sell.returns_exchanges", "sell.edit_sale", "sell.void_sale", "sell.cash_ops"
    ],
    "Customers": [
        "customers.add", "customers.edit", "customers.delete", "customers.export", "customers.manage_groups", "customers.set_on_account_limit"
    ],
    "Products & Inventory": [
        "products.create", "products.edit", "products.delete", "products.adjust_inventory", "products.inventory_counts", "products.stock_orders", "products.stock_returns", "products.stock_transfers", "product_costs.view", "labels.print"
    ],
    "Reporting": [
        "reporting.view_sales", "reporting.view_inventory", "reporting.view_register_closures", "reporting.view_ls_payments"
    ],
    "Setup": [
        "setup.manage_users", "setup.manage_managers", "setup.manage_quick_keys"
    ]
};

export default function RolesPage() {
  const [roles, setRoles] = useState<RolesMatrix | null>(null);
  const [initialRoles, setInitialRoles] = useState<RolesMatrix | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const fetchRoles = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/roles');
      if (!res.ok) throw new Error('Failed to fetch roles');
      const data = await res.json();
      setRoles(data);
      setInitialRoles(JSON.parse(JSON.stringify(data))); // Deep copy for reset
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const handlePermissionChange = (role: keyof RolesMatrix, key: PermissionKey, value: any) => {
    setRoles(prev => {
      if (!prev) return null;
      const newRoles = { ...prev };
      (newRoles[role].permissions as any)[key] = value;
      return newRoles;
    });
  };

  const handleSaveChanges = async () => {
    if (!roles) return;
    setIsSaving(true);
    try {
        const res = await fetch('/api/admin/roles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(roles)
        });
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || 'Failed to save roles.');
        }
        toast({ title: 'Success', description: 'Roles and permissions saved successfully.' });
        fetchRoles(); // Re-fetch to update initial state
    } catch(error) {
        toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
    } finally {
        setIsSaving(false);
    }
  }

  const renderPermissionControl = (role: keyof RolesMatrix, key: PermissionKey) => {
    if (!roles) return null;
    const value = roles[role].permissions[key];
    const isEditable = roles[role].editable;
    const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    if (typeof value === 'boolean') {
      return (
        <div key={key} className="flex items-center justify-between p-3 rounded-md bg-black/20">
          <Label htmlFor={`${role}-${key}`}>{label}</Label>
          <Switch
            id={`${role}-${key}`}
            checked={value}
            onCheckedChange={(checked) => handlePermissionChange(role, key, checked)}
            disabled={!isEditable || isSaving}
          />
        </div>
      );
    }

    if (typeof value === 'number') {
      return (
        <div key={key} className="flex items-center justify-between p-3 rounded-md bg-black/20">
          <Label htmlFor={`${role}-${key}`}>{label} (%)</Label>
          <Input
            id={`${role}-${key}`}
            type="number"
            value={value}
            onChange={(e) => handlePermissionChange(role, key, parseInt(e.target.value))}
            className="w-24"
            disabled={!isEditable || isSaving}
          />
        </div>
      );
    }
    
     if (typeof value === 'string') {
      return (
        <div key={key} className="flex items-center justify-between p-3 rounded-md bg-black/20">
          <Label htmlFor={`${role}-${key}`}>{label}</Label>
          <span className="text-sm font-medium text-brand-accent capitalize">{value.replace('_', ' ')}</span>
        </div>
      );
    }

    return null;
  };

  const renderRoleTab = (role: keyof RolesMatrix) => (
    <TabsContent value={role} className="mt-4">
      <Card className="bg-brand-card border-brand-line">
        <div className="p-4 border-b border-brand-line">
          <h2 className="text-xl font-semibold capitalize">{role}</h2>
          <p className="text-brand-mute">
            {role === 'admin' ? 'Admins have all permissions. This role cannot be edited.' : `Set permissions for the ${role} role.`}
          </p>
        </div>
        <div className="p-4 space-y-8">
            {Object.entries(permissionGroups).map(([groupName, keys]) => (
                <div key={groupName}>
                    <h3 className="text-lg font-semibold mb-4 font-headline">{groupName}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(keys as PermissionKey[]).map(key => renderPermissionControl(role, key))}
                    </div>
                </div>
            ))}
        </div>
      </Card>
    </TabsContent>
  );

  if (isLoading || !roles) {
    return <AdminLayout title="Roles & Permissions"><div>Loading roles...</div></AdminLayout>;
  }

  return (
    <AdminLayout title="Roles & Permissions">
        <Tabs defaultValue="cashier" className="w-full">
          <TabsList>
            <TabsTrigger value="cashier">Cashier</TabsTrigger>
            <TabsTrigger value="manager">Manager</TabsTrigger>
            <TabsTrigger value="admin">Admin</TabsTrigger>
          </TabsList>
          {renderRoleTab('cashier')}
          {renderRoleTab('manager')}
          {renderRoleTab('admin')}
        </Tabs>
        <div className="flex justify-end gap-2 mt-4">
            <Button variant="secondary" onClick={() => setRoles(initialRoles)} disabled={isSaving}>Cancel / Reset</Button>
            <Button onClick={handleSaveChanges} disabled={isSaving} className="bg-brand-accent">
                {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
        </div>
    </AdminLayout>
  );
}
