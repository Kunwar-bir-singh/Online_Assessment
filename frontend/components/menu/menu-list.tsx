'use client';

import { useState } from 'react';
import { MenuItem } from '@/lib/cart-context';
import { MenuCard } from './menu-card';

const MENU_ITEMS: MenuItem[] = [
  {
    id: '1',
    name: 'Classic Margherita',
    description: 'Fresh mozzarella, basil, tomato sauce on crispy dough',
    price: 12.99,
    image: 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=400&h=300&fit=crop',
    category: 'Pizza',
  },
  {
    id: '2',
    name: 'Pepperoni Deluxe',
    description: 'Loaded with premium pepperoni and extra cheese',
    price: 14.99,
    image: 'https://images.unsplash.com/photo-1628840042765-356cda07f4ee?w=400&h=300&fit=crop',
    category: 'Pizza',
  },
  {
    id: '3',
    name: 'Veggie Supreme',
    description: 'Bell peppers, mushrooms, onions, olives and spinach',
    price: 13.49,
    image: 'https://images.unsplash.com/photo-1564936281288-da8149ac3f1c?w=400&h=300&fit=crop',
    category: 'Pizza',
  },
  {
    id: '4',
    name: 'Caesar Salad',
    description: 'Crisp romaine lettuce, croutons, parmesan, Caesar dressing',
    price: 9.99,
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop',
    category: 'Salad',
  },
  {
    id: '5',
    name: 'Greek Salad',
    description: 'Tomatoes, feta cheese, olives, cucumber, fresh herbs',
    price: 10.99,
    image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&h=300&fit=crop',
    category: 'Salad',
  },
  {
    id: '6',
    name: 'Classic Burger',
    description: 'Beef patty, lettuce, tomato, pickles, special sauce',
    price: 11.99,
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop',
    category: 'Burger',
  },
  {
    id: '7',
    name: 'Chocolate Cake',
    description: 'Rich chocolate cake with creamy frosting',
    price: 6.99,
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=300&fit=crop',
    category: 'Dessert',
  },
  {
    id: '8',
    name: 'Iced Tea',
    description: 'Refreshing cold iced tea, perfectly chilled',
    price: 3.99,
    image: 'https://images.unsplash.com/photo-1556742212-5b321f3c261d?w=400&h=300&fit=crop',
    category: 'Beverage',
  },
];

export function MenuList() {
  const [activeCategory, setActiveCategory] = useState('All');
  
  const categories = ['All', ...new Set(MENU_ITEMS.map((item) => item.category))];
  
  const filteredItems = activeCategory === 'All'
    ? MENU_ITEMS
    : MENU_ITEMS.filter((item) => item.category === activeCategory);

  return (
    <div className="space-y-6">
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              activeCategory === category
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-muted'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredItems.map((item) => (
          <MenuCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
