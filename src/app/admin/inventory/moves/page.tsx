
'use client';
import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { type InventoryMove, type Ingredient } from '@/lib/data';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

type EnrichedMove = InventoryMove & { ingredientName?: string };

export default function InventoryMovesPage() {
  const [moves, setMoves] = useState<EnrichedMove[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchMovesAndIngredients = async () => {
      try {
        const movesRes = await fetch('/api/inventory/moves?limit=100');
        const movesData = await movesRes.json();
        if (!movesRes.ok) throw new Error(movesData.message || 'Failed to fetch moves');
        
        let ingredientsMap = new Map<string, string>();
        try {
            const ingredientsRes = await fetch('/api/inventory/summary');
            const ingredientsData = await ingredientsRes.json();
            if(ingredientsRes.ok) {
                 ingredientsMap = new Map<string, string>(ingredientsData.map((i: Ingredient) => [i.id, i.name]));
            }
        } catch (e) {
            console.warn("Could not fetch ingredient names for history page", e)
        }

        const enrichedMoves = movesData.map((move: InventoryMove) => ({
            ...move,
            ingredientName: ingredientsMap.get(move.ingredientId) || move.ingredientId
        }));
        
        setMoves(enrichedMoves);

      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch inventory history.' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchMovesAndIngredients();
  }, [toast]);

  return (
    <AdminLayout title="Inventory History">
        <div className="flex items-center gap-4 mb-4">
            <Button variant="secondary" size="icon" asChild>
                <Link href="/admin/inventory">
                    <ArrowLeft className="h-4 w-4" />
                </Link>
            </Button>
            <h1 className="font-semibold text-lg md:text-xl">Inventory Movements</h1>
        </div>
        <Card className="bg-brand-card border-brand-line">
          <div className="p-4 border-b border-brand-line">
            <h2 className="text-xl font-semibold">Movement Log</h2>
            <p className="text-brand-mute">A log of all inventory transactions.</p>
          </div>
          <div className="p-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Ingredient</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center">Loading...</TableCell></TableRow>
                ) : moves.length > 0 ? (
                  moves.map((move) => (
                    <TableRow key={move.id}>
                      <TableCell className="text-xs">{new Date(move.timestamp).toLocaleString()}</TableCell>
                      <TableCell className="font-medium">{move.ingredientName}</TableCell>
                      <TableCell><span className="capitalize">{move.type}</span></TableCell>
                      <TableCell className={`text-right font-mono ${move.quantity > 0 ? 'text-brand-ok' : 'text-brand-accent'}`}>
                        {move.quantity > 0 ? '+' : ''}{move.quantity}
                      </TableCell>
                       <TableCell className="text-xs font-mono">{move.ref || 'N/A'}</TableCell>
                      <TableCell className="text-xs">{move.note || 'N/A'}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={6} className="text-center">No inventory movements found.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
    </AdminLayout>
  );
}
