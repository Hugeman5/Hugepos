
'use client';

import { useState } from 'react';
import Image from 'next/image';
import Card from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  type Product,
  type Category,
  type Modifier,
  type CartLine,
} from '@/lib/data';
import { cn } from '@/lib/utils';
import { Input } from './ui/input';

type ProductGridProps = {
  categories: Category[];
  productsByCategory: Record<string, Product[]>;
  allModifiers: Modifier[];
  onAddToCart: (product: Product, mods: CartLine['mods']) => void;
  qtyBuffer: number;
};

type SelectedMods = Record<string, { optionId?: string; count?: number }>;

export default function ProductGrid({
  categories,
  productsByCategory,
  allModifiers,
  onAddToCart,
  qtyBuffer,
}: ProductGridProps) {
  const [selectedCategory, setSelectedCategory] = useState(categories[0]?.id || 'all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedMods, setSelectedMods] = useState<SelectedMods>({});
  const [isModifierDialogOpen, setIsModifierDialogOpen] = useState(false);

  const handleProductClick = (product: Product) => {
    const productModifiers =
      allModifiers.filter((m) => product.modifierIds?.includes(m.id)) || [];
    if (productModifiers.length > 0) {
      setSelectedProduct(product);
      setSelectedMods({}); // Reset mods when opening
      setIsModifierDialogOpen(true);
    } else {
      onAddToCart(product, []); // No modifiers, add directly to cart
    }
  };

  const handleModifierSubmit = () => {
    if (!selectedProduct) return;
    const modsForCart: CartLine['mods'] = Object.entries(selectedMods)
      .map(([id, value]) => ({
        id,
        optionId: value.optionId,
        count: value.count,
      }))
      .filter((m) => (m.optionId || (m.count && m.count > 0)));

    onAddToCart(selectedProduct, modsForCart);
    setIsModifierDialogOpen(false);
  };

  const handleModChange = (modifierId: string, value: { optionId?: string; count?: number }) => {
    setSelectedMods(prev => ({
        ...prev,
        [modifierId]: value
    }));
  }

  const products = productsByCategory[selectedCategory] || [];

  return (
    <div className="flex flex-col gap-4 h-full">
      <Tabs defaultValue={selectedCategory} onValueChange={setSelectedCategory}>
        <div className="overflow-x-auto pb-2">
          <TabsList>
            {categories.map((cat) => (
              <TabsTrigger key={cat.id} value={cat.id}>
                {cat.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
      </Tabs>
      <div className="flex-1 overflow-y-auto pr-2 relative">
         {qtyBuffer > 1 && (
          <div className="absolute top-2 right-4 z-10 bg-accent text-accent-foreground rounded-full h-10 w-10 flex items-center justify-center text-lg font-bold shadow-lg">
            x{qtyBuffer}
          </div>
        )}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {products.map((product) => (
            <Card
              key={product.id}
              onClick={() => handleProductClick(product)}
              className="overflow-hidden flex flex-col hover:shadow-md transition-shadow cursor-pointer p-0"
            >
              <div className="p-0 relative h-32">
                <Image
                  src={
                    product.imageUrl ||
                    `https://placehold.co/300x200.png`
                  }
                  alt={product.name}
                  fill
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                  className="object-cover"
                />
              </div>
              <div className="p-3 flex-1 flex flex-col">
                <h3 className="font-semibold leading-tight">{product.name}</h3>
              </div>
               <div className="p-3 pt-0">
                 <p className="text-muted-foreground text-sm font-bold">
                  ${product.price.toFixed(2)}
                </p>
               </div>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={isModifierDialogOpen} onOpenChange={setIsModifierDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Customize {selectedProduct?.name}</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-6">
            {allModifiers
              .filter((m) => selectedProduct?.modifierIds?.includes(m.id))
              .map((mod) => (
                <div key={mod.id}>
                  <h4 className="font-semibold mb-2">{mod.name}</h4>
                  {mod.type === 'choice' && (
                    <RadioGroup onValueChange={(val) => handleModChange(mod.id, { optionId: val })}>
                        <div className="space-y-2">
                             {mod.options?.map((opt) => (
                                <div key={opt.id} className="flex items-center space-x-2">
                                    <RadioGroupItem value={opt.id} id={`${mod.id}-${opt.id}`} />
                                    <Label htmlFor={`${mod.id}-${opt.id}`} className="flex-1">
                                        {opt.name} (+${opt.delta.toFixed(2)})
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </RadioGroup>
                  )}
                   {mod.type === 'count' && (
                    <div className="flex items-center gap-4">
                       <Label>Quantity (max {mod.max})</Label>
                       <Input 
                            type="number" 
                            min="0" 
                            max={mod.max} 
                            defaultValue="0"
                            className="w-24"
                            onChange={(e) => handleModChange(mod.id, { count: parseInt(e.target.value)})}
                        />
                         <span className="text-sm text-muted-foreground">
                            +${mod.deltaPerUnit.toFixed(2)} each
                        </span>
                    </div>
                  )}
                </div>
              ))}
          </div>
          <DialogFooter>
            <DialogClose asChild>
                <Button type="button" variant="secondary">Cancel</Button>
            </DialogClose>
            <Button onClick={handleModifierSubmit}>Add to Order</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
