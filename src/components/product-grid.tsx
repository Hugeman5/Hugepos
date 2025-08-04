'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { type Product, type Category } from '@/lib/data';

type ProductGridProps = {
  products: Product[];
  categories: Category[];
};

export default function ProductGrid({ products, categories }: ProductGridProps) {
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredProducts =
    selectedCategory === 'All'
      ? products
      : products.filter((p) => p.category === selectedCategory);
  
  const handleAddToCart = (product: Product) => {
    document.dispatchEvent(new CustomEvent('addToCart', { detail: product }));
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      <Tabs defaultValue="All" onValueChange={setSelectedCategory}>
        <div className="overflow-x-auto pb-2">
          <TabsList>
            <TabsTrigger value="All">All</TabsTrigger>
            {categories.map((cat) => (
              <TabsTrigger key={cat.id} value={cat.name}>
                {cat.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
      </Tabs>
      <div className="flex-1 overflow-y-auto pr-2">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="overflow-hidden flex flex-col hover:shadow-md transition-shadow">
              <CardHeader className="p-0 relative h-32">
                 <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                    className="object-cover"
                    data-ai-hint={product.dataAiHint}
                 />
              </CardHeader>
              <CardContent className="p-4 flex-1">
                <h3 className="font-semibold leading-tight">{product.name}</h3>
                <p className="text-muted-foreground text-sm">${product.price.toFixed(2)}</p>
              </CardContent>
              <CardFooter className="p-2 mt-auto">
                <Button className="w-full" variant="outline" onClick={() => handleAddToCart(product)}>
                  Add to Order
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
