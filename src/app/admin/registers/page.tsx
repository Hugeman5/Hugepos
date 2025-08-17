
'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { type Register, type Shift } from '@/lib/data';
import { PlusCircle, Trash2 } from 'lucide-react';
import { timeSince } from '@/lib/utils';
import Link from 'next/link';

export default function RegistersPage() {
  const [registers, setRegisters] = useState<Register[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newRegisterName, setNewRegisterName] = useState('');
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [regRes, shiftsRes] = await Promise.all([
        fetch('/api/register/all'),
        fetch('/api/register/shifts/recent')
      ]);

      if (!regRes.ok) throw new Error('Failed to fetch registers.');
      const regData = await regRes.json();
      setRegisters(regData);

      if (shiftsRes.ok) {
        const shiftsData = await shiftsRes.json();
        setShifts(shiftsData);
      }

    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddRegister = () => {
    if (!newRegisterName.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Register name cannot be empty.' });
      return;
    }
    const newId = newRegisterName.trim().toLowerCase().replace(/\s+/g, '_');
    if (registers.some(s => s.id === newId)) {
        toast({ variant: 'destructive', title: 'Error', description: `Register with ID "${newId}" already exists.` });
        return;
    }
    const newRegister: Register = { id: newId, name: newRegisterName.trim() };
    setRegisters(prev => [...prev, newRegister]);
    setNewRegisterName('');
  };

  const handleRemoveRegister = (id: string) => {
    if (shifts.some(s => s.registerId === id)) {
        toast({ variant: 'destructive', title: 'Error', description: 'Cannot delete a register that has associated shifts.' });
        return;
    }
    setRegisters(prev => prev.filter(s => s.id !== id));
  };
  
  const handleSaveChanges = async () => {
      setIsSaving(true);
      try {
          const res = await fetch('/api/register/all', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(registers)
          });
          if (!res.ok) {
              const errorData = await res.json();
              throw new Error(errorData.message || 'Failed to save registers.');
          }
          toast({ title: 'Success', description: 'Registers saved successfully.' });
          fetchData();
      } catch(error) {
           toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
      } finally {
          setIsSaving(false);
      }
  }

  return (
    <AdminLayout title="Register Management">
        <div className="grid md:grid-cols-2 gap-8">
            <Card className="bg-brand-card border-brand-line">
              <div className="p-4 border-b border-brand-line">
                <h2 className="text-xl font-semibold">Manage Registers</h2>
                <p className="text-brand-mute">Add or remove cash registers for your outlets.</p>
              </div>
              <div className="p-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Register Name</TableHead>
                      <TableHead>Register ID</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow><TableCell colSpan={3} className="text-center">Loading...</TableCell></TableRow>
                    ) : registers.map((register) => (
                      <TableRow key={register.id}>
                        <TableCell className="font-medium">{register.name}</TableCell>
                        <TableCell className="font-mono text-muted-foreground">{register.id}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="secondary" size="icon" onClick={() => handleRemoveRegister(register.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                 <div className="mt-4 flex items-center gap-2">
                     <Input 
                        placeholder="New Register Name"
                        value={newRegisterName}
                        onChange={(e) => setNewRegisterName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddRegister()}
                     />
                     <Button onClick={handleAddRegister} className="bg-brand-accent"><PlusCircle className="mr-2"/> Add</Button>
                </div>
                 <div className="flex justify-end gap-2 mt-4">
                    <Button variant="secondary" onClick={fetchData}>Cancel</Button>
                    <Button onClick={handleSaveChanges} disabled={isSaving} className="bg-brand-accent">
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
              </div>
            </Card>

            <Card className="bg-brand-card border-brand-line">
                <div className="p-4 border-b border-brand-line">
                    <h2 className="text-xl font-semibold">Recent Shifts</h2>
                    <p className="text-brand-mute">A log of the most recent register shifts.</p>
                </div>
                <div className="p-4">
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Register</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Opened</TableHead>
                                <TableHead className="text-right">Report</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                 <TableRow><TableCell colSpan={4} className="text-center">Loading...</TableCell></TableRow>
                            ) : shifts.map(s => (
                                <TableRow key={s.id}>
                                    <TableCell>{registers.find(r => r.id === s.registerId)?.name || s.registerId}</TableCell>
                                    <TableCell className="capitalize">{s.status}</TableCell>
                                    <TableCell>{timeSince(s.tsOpen)} by {s.userNameOpen}</TableCell>
                                    <TableCell className="text-right">
                                        {s.status === 'closed' ? (
                                            <Button asChild variant="link" size="sm">
                                                <Link href={`/admin/reports/register/${s.id}`}>View</Link>
                                            </Button>
                                        ) : 'N/A'}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                     </Table>
                </div>
            </Card>
        </div>
    </AdminLayout>
  );
}
