import { ExpenseCategory } from './index';

export const DEFAULT_CATEGORIES: ExpenseCategory[] = [
  {
    id: 'food',
    name: 'Food & Dining',
    icon: 'restaurant',
    emoji: '🍕',
    color: '#FF6B6B'
  },
  {
    id: 'transport',
    name: 'Transport',
    icon: 'directions-car',
    emoji: '🚗',
    color: '#4ECDC4'
  },
  {
    id: 'books',
    name: 'Books & Study',
    icon: 'book',
    emoji: '📚',
    color: '#45B7D1'
  },
  {
    id: 'entertainment',
    name: 'Entertainment',
    icon: 'movie',
    emoji: '🎬',
    color: '#96CEB4'
  },
  {
    id: 'shopping',
    name: 'Shopping',
    icon: 'shopping-bag',
    emoji: '🛍️',
    color: '#FFEAA7'
  },
  {
    id: 'health',
    name: 'Health & Fitness',
    icon: 'fitness-center',
    emoji: '💊',
    color: '#DDA0DD'
  },
  {
    id: 'rent',
    name: 'Rent & Bills',
    icon: 'home',
    emoji: '🏠',
    color: '#FF7675'
  },
  {
    id: 'personal',
    name: 'Personal Care',
    icon: 'person',
    emoji: '💄',
    color: '#FDCB6E'
  },
  {
    id: 'technology',
    name: 'Technology',
    icon: 'phone-android',
    emoji: '📱',
    color: '#74B9FF'
  },
  {
    id: 'misc',
    name: 'Miscellaneous',
    icon: 'more-horiz',
    emoji: '📦',
    color: '#A29BFE'
  }
];

// Category mapping for AI auto-categorization
export const CATEGORY_KEYWORDS: Record<string, string[]> = {
  food: [
    'lunch', 'dinner', 'breakfast', 'restaurant', 'cafe', 'coffee', 'pizza', 
    'burger', 'food', 'snack', 'meal', 'eat', 'dining', 'kitchen', 'grocery',
    'mcdonalds', 'kfc', 'subway', 'starbucks', 'dominos'
  ],
  transport: [
    'uber', 'taxi', 'bus', 'train', 'metro', 'fuel', 'gas', 'petrol',
    'parking', 'toll', 'rickshaw', 'auto', 'ola', 'transport', 'travel'
  ],
  books: [
    'book', 'textbook', 'study', 'course', 'education', 'library', 'notes',
    'stationery', 'pen', 'pencil', 'notebook', 'academic', 'tuition', 'class'
  ],
  entertainment: [
    'movie', 'cinema', 'netflix', 'spotify', 'game', 'gaming', 'party',
    'club', 'bar', 'concert', 'show', 'theater', 'entertainment', 'fun'
  ],
  shopping: [
    'clothes', 'shirt', 'shoes', 'shopping', 'mall', 'amazon', 'flipkart',
    'dress', 'jeans', 'accessories', 'bag', 'watch', 'jewelry', 'gift'
  ],
  health: [
    'medicine', 'doctor', 'hospital', 'pharmacy', 'gym', 'fitness', 'health',
    'medical', 'clinic', 'checkup', 'vitamin', 'supplement', 'workout'
  ],
  rent: [
    'rent', 'electricity', 'water', 'internet', 'wifi', 'bills', 'utility',
    'maintenance', 'deposit', 'home', 'house', 'apartment'
  ],
  personal: [
    'haircut', 'salon', 'cosmetic', 'shampoo', 'soap', 'toothpaste', 'personal',
    'grooming', 'spa', 'beauty', 'skincare', 'hygiene'
  ],
  technology: [
    'phone', 'mobile', 'laptop', 'computer', 'software', 'app', 'tech',
    'gadget', 'charger', 'headphones', 'bluetooth', 'electronics'
  ],
  misc: [
    'miscellaneous', 'other', 'various', 'random', 'general', 'misc'
  ]
};

export function getCategoryById(categoryId: string): ExpenseCategory | undefined {
  return DEFAULT_CATEGORIES.find(cat => cat.id === categoryId);
}

export function getCategoryByName(name: string): ExpenseCategory | undefined {
  return DEFAULT_CATEGORIES.find(cat => 
    cat.name.toLowerCase().includes(name.toLowerCase())
  );
}