"use client";

import Link from 'next/link';
import { useState } from 'react';

interface CategoryPillProps {
  name: string;
  slug?: string;
  image?: string;
  isActive?: boolean;
  onClick?: () => void;
}

const defaultImages: Record<string, string> = {
  men: "https://images.unsplash.com/photo-1617137968427-85924c809a1d?w=400&auto=format&fit=crop",
  women: "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=400&auto=format&fit=crop",
  kids: "https://images.unsplash.com/photo-1519457431-44ccd64a579b?w=400&auto=format&fit=crop",
  ethnic: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=400&auto=format&fit=crop",
  sportswear: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&auto=format&fit=crop",
  accessories: "https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=400&auto=format&fit=crop",
};

export default function CategoryPill({ 
  name, 
  slug, 
  image, 
  isActive = false, 
  onClick 
}: CategoryPillProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  const categorySlug = slug || name.toLowerCase();
  const bgImage = image || defaultImages[categorySlug] || defaultImages.men;

  return (
    <Link href={`/products?category=${categorySlug}`}>
      <div
        className={`relative overflow-hidden rounded-full px-6 py-3 font-bold text-sm transition-all duration-300 cursor-pointer
          ${isActive 
            ? 'bg-saffron text-white shadow-lg shadow-saffron/30' 
            : 'bg-gray-100 dark:bg-gray-800 text-charcoal dark:text-offwhite shadow-md hover:shadow-lg hover:-translate-y-1 border border-gray-200 dark:border-gray-700'
          }
          ${isHovered && !isActive ? 'ring-2 ring-saffron ring-offset-2' : ''}
        `}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onClick}
      >
        <span className="relative z-10 flex items-center gap-2">
          {name}
        </span>
        
        {isHovered && !isActive && (
          <div 
            className="absolute inset-0 opacity-10 transition-opacity"
            style={{
              backgroundImage: `url(${bgImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        )}
      </div>
    </Link>
  );
}

export const categories = [
  { name: 'Men', slug: 'men' },
  { name: 'Women', slug: 'women' },
  { name: 'Kids', slug: 'kids' },
  { name: 'Ethnic', slug: 'ethnic' },
  { name: 'Sportswear', slug: 'sportswear' },
  { name: 'Accessories', slug: 'accessories' },
];
