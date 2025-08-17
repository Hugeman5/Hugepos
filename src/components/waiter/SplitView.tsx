
'use client';
import { useState, useEffect, useCallback } from 'react';
import { type ServiceCheck, type Order, type OrderLine } from '@/lib/data';
import * as ordersRepo from '@/lib/ordersRepo';
import { useToast } from '@/hooks/use-toast';
import { Button } from '../ui/Button';
import { X, UserPlus, Trash2 } from 'lucide-react';
import { formatMoney } from '@/lib/money';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { cn } from '@/lib/utils';

const ItemTypes = {
  LINE: 'line',
};

interface DraggableLineProps {
  line: OrderLine;
  orderId: string;
}

const DraggableLine: React.FC<DraggableLineProps> = ({ line, orderId }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.LINE,
    item: { lineId: line.lineId, fromOrderId: orderId },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      className={cn('p-2 rounded-lg bg-background flex justify-between items-center cursor-move', isDragging && 'opacity-50')}
    >
      <div>
        <p className="font-medium">{line.qty}x {line.name}</p>
        {line.mods && line.mods.length > 0 && (
          <p className="text-xs text-muted-foreground">{line.mods.map(m => m.optionName).join(', ')}</p>
        )}
      </div>
      <span className="font-mono text-sm">{formatMoney(line.lineTotal / 100)}</span>
    </div>
  );
};

interface CheckColumnProps {
  order: Order;
  onDrop: (lineId: string, fromOrderId: string) => void;
  onPay: (orderId: string) => void;
}

const CheckColumn: React.FC<CheckColumnProps> = ({ order, onDrop, onPay }) => {
  const [{ canDrop, isOver }, drop] = useDrop(() => ({
    accept: ItemTypes.LINE,
    drop: (item: { lineId: string; fromOrderId: string }) => {
      if (item.fromOrderId !== order.id) {
        onDrop(item.lineId, item.fromOrderId);
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop(),
    }),
  }));

  const isActive = canDrop && isOver;

  return (
    <div
      ref={drop}
      className={cn('flex-1 flex flex-col border border-dashed rounded-lg p-2 gap-2 min-w-72', isActive ? 'border-primary bg-primary/10' : 'border-border')}
    >
      <div className="p-2 text-center">
        <h3 className="font-semibold">Check {order.number}</h3>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto">
        {order.lines.map(line => (
          <DraggableLine key={line.lineId} line={line} orderId={order.id} />
        ))}
        {order.lines.length === 0 && <p className="text-center text-sm text-muted-foreground pt-4">Drag items here</p>}
      </div>
      <div className="mt-auto pt-2 border-t border-border">
        <div className="flex justify-between font-semibold p-2">
          <span>Total</span>
          <span>{formatMoney(order.totals.total / 100)}</span>
        </div>
        <Button className="w-full" onClick={() => onPay(order.id)} disabled={order.lines.length === 0}>
          Pay
        </Button>
      </div>
    </div>
  );
};

export const SplitView = ({ check, onClose }: { check: ServiceCheck, onClose: () => void }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const { toast } = useToast();

  const fetchOrders = useCallback(async () => {
    const orderIds = [check.orderId, ...(check.splits?.map(s => s.orderId) || [])];
    const fetchedOrders = await Promise.all(
      orderIds.map(id => fetch(`/api/orders/${id}`).then(res => res.json()))
    );
    setOrders(fetchedOrders);
  }, [check]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleAddSplit = async () => {
    try {
      const res = await fetch('/api/service/split', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkId: check.id }),
      });
      if (!res.ok) throw new Error('Failed to create split');
      // Re-fetch everything to get the new state
      fetchOrders();
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: (e as Error).message });
    }
  };

  const handleMoveLine = async (lineId: string, fromOrderId: string, toOrderId: string) => {
    try {
        const res = await fetch('/api/service/move-line', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lineId, fromOrderId, toOrderId }),
        });
        if (!res.ok) throw new Error('Failed to move item');
        // Optimistic update
        setOrders(currentOrders => {
            const fromOrder = currentOrders.find(o => o.id === fromOrderId);
            const toOrder = currentOrders.find(o => o.id === toOrderId);
            if (!fromOrder || !toOrder) return currentOrders;

            const lineToMove = fromOrder.lines.find(l => l.lineId === lineId);
            if (!lineToMove) return currentOrders;

            const newFromLines = fromOrder.lines.filter(l => l.lineId !== lineId);
            const newToLines = [...toOrder.lines, lineToMove];
            
            // This won't have updated totals, but it's a fast UI response.
            // The next fetch will correct the totals.
            return currentOrders.map(o => {
                if (o.id === fromOrderId) return { ...o, lines: newFromLines };
                if (o.id === toOrderId) return { ...o, lines: newToLines };
                return o;
            });
        });
        // Fetch real data to update totals
        setTimeout(fetchOrders, 50);

    } catch (e) {
        toast({ variant: 'destructive', title: 'Error', description: (e as Error).message });
    }
  };
  
  const handlePay = (orderId: string) => {
      // This would open the payment dialog for the specific order
      toast({ title: 'Payment', description: `Initiating payment for order ${orderId}` });
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex-1 flex flex-col p-4 gap-4 overflow-hidden">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Split Check for Table {check.tableId}</h2>
          <Button onClick={onClose} variant="secondary" size="icon"><X/></Button>
        </div>
        <div className="flex-1 flex gap-4 overflow-x-auto pb-4">
          {orders.map(order => (
            <CheckColumn
              key={order.id}
              order={order}
              onDrop={(lineId, fromOrderId) => handleMoveLine(lineId, fromOrderId, order.id)}
              onPay={handlePay}
            />
          ))}
          <div className="flex-1 flex items-center justify-center min-w-72">
            <Button onClick={handleAddSplit} variant="secondary" className="h-full w-full border-dashed">
                <UserPlus className="mr-2"/> Add Check
            </Button>
          </div>
        </div>
      </div>
    </DndProvider>
  );
};
