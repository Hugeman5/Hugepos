
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  type MenuItem,
  type Menu,
} from '@/lib/menuRepo';
import {
  type CartLineMod,
} from '@/lib/data';
import { Checkbox } from './ui/checkbox';
import { formatMoney } from '@/lib/money';
import { type Settings } from '@/lib/settingsRepo';

type ProductGridProps = {
  menu: Menu;
  onAddToCart: (product: MenuItem, mods: CartLineMod[]) => void;
  qtyBuffer: number;
};

type SelectedMods = Record<string, string[]>; // setId -> optionId[]

function ModifierDialog({ product, menu, open, onOpenChange, onAddToCart, settings }: {
    product: MenuItem,
    menu: Menu,
    open: boolean,
    onOpenChange: (open: boolean) => void,
    onAddToCart: (product: MenuItem, mods: CartLineMod[]) => void,
    settings: Settings
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
        
        const modsForCart = Object.entries(selectedMods).map(([setId, optionIds]) => ({
            setId,
            optionIds
        }));
        
        onAddToCart(product, modsForCart);
        onOpenChange(false);
    }
    
    // Reset state when dialog is re-opened for a new product
    useEffect(() => {
        if(open) {
            setSelectedMods({});
        }
    }, [open]);

    const money = (value: number) => {
      return formatMoney(value, { currency: settings.currency, locale: settings.locale });
    };

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
                                                        <span className="text-muted-foreground ml-2">(+{money(opt.priceDeltaCents/100)})</span>}
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
                                                    <span className="text-muted-foreground ml-2">(+{money(opt.priceDeltaCents/100)})</span>}
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
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    async function fetchSettings() {
        try {
            const res = await fetch('/api/settings');
            if (!res.ok) throw new Error('Failed to fetch settings');
            const data = await res.json();
            setSettings(data);
        } catch(e) {
             console.error(e);
        }
    }
    fetchSettings();
  }, []);

  const handleProductClick = (product: MenuItem) => {
    if (product.modifierSetIds && product.modifierSetIds.length > 0) {
      setSelectedProduct(product);
    } else {
      onAddToCart(product, []); // No modifiers, add directly to cart
    }
  };
  
  const products = menu.items.filter(i => i.catId === selectedCategory && i.active);

  const money = (value: number) => {
    if (!settings) return `...`;
    return formatMoney(value, { currency: settings.currency, locale: settings.locale });
  };

  if (!settings) return <div>Loading...</div>

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
              <CardContent className="p-3 flex-1 flex flex-col">
                <h3 className="font-semibold leading-tight">{product.name}</h3>
                 <p className="text-muted-foreground text-sm font-bold mt-auto pt-2">
                  {money(product.priceCents / 100)}
                </p>
               </CardContent>
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
            settings={settings}
        />
      )}

    </div>
  );
}
