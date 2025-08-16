'use client';
import { useState, useEffect } from 'react';
import DashboardHeader from '@/components/dashboard-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
        const [movesRes, ingredientsRes] = await Promise.all([
          fetch('/api/inventory/moves?limit=100'),
          fetch('/api/costing/ingredients') 
        ]);
        
        const movesData = await movesRes.json();
        const ingredientsData = await ingredientsRes.json();

        if (!movesRes.ok) throw new Error(movesData.message || 'Failed to fetch moves');
        if (!ingredientsRes.ok) throw new Error(ingredientsData.message || 'Failed to fetch ingredients');
        
        const ingredientsMap = new Map<string, string>(ingredientsData.map((i: Ingredient) => [i.id, i.name]));

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
    <div className="flex min-h-screen w-full flex-col">
      <DashboardHeader title="Inventory History" userName="Admin User" userRole="Admin" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
                <Link href="/dashboard-admin/inventory">
                    <ArrowLeft className="h-4 w-4" />
                </Link>
            </Button>
            <h1 className="font-semibold text-lg md:text-xl">Inventory Movements</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Movement Log</CardTitle>
            <CardDescription>A log of all inventory transactions.</CardDescription>
          </CardHeader>
          <CardContent>
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
                      <TableCell className={`text-right font-mono ${move.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
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
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
