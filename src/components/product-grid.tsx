
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
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
  type MenuItem,
  type Category,
  type Menu,
  type ModifierSet,
  type ModifierOption
} from '@/lib/menuRepo';
import {
  type CartLineMod,
} from '@/lib/data';
import { cn } from '@/lib/utils';
import { Input } from './ui/input';
import { formatMoney } from '@/lib/money';
import { Checkbox } from './ui/checkbox';

type ProductGridProps = {
  menu: Menu;
  onAddToCart: (product: MenuItem, mods: CartLineMod[]) => void;
  qtyBuffer: number;
};

type SelectedMods = Record<string, string[]>; // setId -> optionId[]

function ModifierDialog({ product, menu, open, onOpenChange, onAddToCart }: {
    product: MenuItem,
    menu: Menu,
    open: boolean,
    onOpenChange: (open: boolean) => void,
    onAddToCart: (product: MenuItem, mods: CartLineMod[]) => void,
}) {
    const [selectedMods, setSelectedMods] = useState<SelectedMods>({});

    const applicableSets = menu.modifierSets.filter(ms => product.modifierSetIds?.includes(ms.id));

    const handleSingleSelect = (setId: string, optionId: string) => {
        setSelectedMods(prev => ({...prev, [setId]: [optionId]}));
    };
    
    const handleMultiSelect = (setId: string, optionId: string, checked: boolean) => {
        setSelectedMods(prev => {
            const existing = prev[setId] || [];
            if (checked) {
                return {...prev, [setId]: [...existing, optionId]};
            } else {
                return {...prev, [setId]: existing.filter(id => id !== optionId)};
            }
        });
    }
    
    const isSelectionValid = () => {
        for (const set of applicableSets) {
            const selection = selectedMods[set.id] || [];
            if (set.required && selection.length < set.min) return false;
            if (selection.length > set.max) return false;
        }
        return true;
    }

    const handleSubmit = () => {
        if (!isSelectionValid()) return;
        const modsForCart: CartLineMod[] = Object.entries(selectedMods)
            .flatMap(([setId, optionIds]) => optionIds.map(optionId => ({ setId, optionId }))) // This needs to be transformed correctly for the cart
            .reduce((acc, { setId, optionId }) => {
                const existing = acc.find(m => m.setId === setId);
                if (existing) {
                    existing.optionIds.push(optionId);
                } else {
                    acc.push({ setId, optionIds: [optionId] });
                }
                return acc;
            }, [] as CartLineMod[]);
        
        onAddToCart(product, modsForCart);
        onOpenChange(false);
    }
    
    // Reset state when dialog is re-opened for a new product
    useState(() => {
        if(open) {
            setSelectedMods({});
        }
    });


    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Customize {product.name}</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-6 max-h-[60vh] overflow-y-auto">
                    {applicableSets.map(set => (
                        <div key={set.id}>
                            <h4 className="font-semibold mb-2">{set.name} {set.required && <span className="text-destructive">*</span>}</h4>
                            
                            {set.type === 'single' && (
                                <RadioGroup onValueChange={(val) => handleSingleSelect(set.id, val)}>
                                    <div className="space-y-2">
                                        {set.options.map(opt => (
                                            <div key={opt.id} className="flex items-center space-x-2">
                                                <RadioGroupItem value={opt.id} id={`${set.id}-${opt.id}`} />
                                                <Label htmlFor={`${set.id}-${opt.id}`} className="flex-1">
                                                    {opt.name} 
                                                    {opt.priceDeltaCents > 0 && 
                                                        <span className="text-muted-foreground ml-2">(+{formatMoney(opt.priceDeltaCents/100)})</span>}
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                </RadioGroup>
                            )}

                             {set.type === 'multi' && (
                                <div className="space-y-2">
                                    {set.options.map((opt) => (
                                        <div key={opt.id} className="flex items-center space-x-2">
                                            <Checkbox 
                                                id={`${set.id}-${opt.id}`}
                                                onCheckedChange={(checked) => handleMultiSelect(set.id, opt.id, !!checked)}
                                                checked={selectedMods[set.id]?.includes(opt.id)}
                                                disabled={(selectedMods[set.id]?.length || 0) >= set.max && !selectedMods[set.id]?.includes(opt.id)}
                                            />
                                             <Label htmlFor={`${set.id}-${opt.id}`} className="flex-1">
                                                {opt.name} 
                                                {opt.priceDeltaCents > 0 && 
                                                    <span className="text-muted-foreground ml-2">(+{formatMoney(opt.priceDeltaCents/100)})</span>}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            )}

                        </div>
                    ))}
                </div>
                <DialogFooter>
                    <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={!isSelectionValid()}>Add to Order</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}


export default function ProductGrid({
  menu,
  onAddToCart,
  qtyBuffer,
}: ProductGridProps) {
  const [selectedCategory, setSelectedCategory] = useState(menu.categories[0]?.id || 'all');
  const [selectedProduct, setSelectedProduct] = useState<MenuItem | null>(null);

  const handleProductClick = (product: MenuItem) => {
    if (product.modifierSetIds && product.modifierSetIds.length > 0) {
      setSelectedProduct(product);
    } else {
      onAddToCart(product, []); // No modifiers, add directly to cart
    }
  };
  
  const products = menu.items.filter(i => i.catId === selectedCategory && i.active);

  return (
    <div className="flex flex-col gap-4 h-full">
      <Tabs defaultValue={selectedCategory} onValueChange={setSelectedCategory}>
        <div className="overflow-x-auto pb-2">
          <TabsList>
            {menu.categories.filter(c => c.active).map((cat) => (
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
                  src={`https://placehold.co/300x200.png`}
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
                  {formatMoney(product.priceCents / 100, 'ZAR', 'en-ZA')}
                </p>
               </div>
            </Card>
          ))}
        </div>
      </div>
      
      {selectedProduct && (
        <ModifierDialog 
            product={selectedProduct}
            menu={menu}
            open={!!selectedProduct}
            onOpenChange={(open) => !open && setSelectedProduct(null)}
            onAddToCart={onAddToCart}
        />
      )}

    </div>
  );
}
