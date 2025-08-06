'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const products = [
  { id: 1, name: 'Espresso', price: 2.5, category: 'Coffee' },
  { id: 2, name: 'Latte', price: 3.5, category: 'Coffee' },
  { id: 3, name: 'Cappuccino', price: 3.5, category: 'Coffee' },
  { id: 4, name: 'Croissant', price: 2.0, category: 'Pastries' },
  { id: 5, name: 'Muffin', price: 2.2, category: 'Pastries' },
  { id: 6, name: 'Sandwich', price: 5.5, category: 'Food' },
  { id: 7, name: 'Salad', price: 6.0, category: 'Food' },
];

const categories = ['All', 'Coffee', 'Pastries', 'Food'];

export default function ProductGrid() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (selectedCategory === 'All' || product.category === selectedCategory)
  );

  return (
    <div>
      <div className="mb-4 flex space-x-4">
        <Input
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-xs"
        />
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {filteredProducts.map((product) => (
          <Button key={product.id} variant="outline" className="h-24">
            {product.name}
          </Button>
        ))}
      </div>
    </div>
  );
}
