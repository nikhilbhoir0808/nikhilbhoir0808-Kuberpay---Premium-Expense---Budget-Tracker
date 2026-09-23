import React from 'react';
import {
  Utensils,
  ShoppingCart,
  ShoppingBag,
  Home,
  Car,
  Zap,
  Film,
  HeartPulse,
  Plane,
  TrendingUp,
  Wallet,
  Laptop,
  ArrowUpRight,
  Gift,
  PlusCircle,
  ShieldCheck,
  Bike,
  Compass,
  Target,
  CreditCard,
  Banknote,
  Building2,
  Smartphone,
  Coffee,
  Fuel,
  Receipt,
  Tag,
  CircleDot,
  LucideIcon,
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  utensils: Utensils,
  'shopping-cart': ShoppingCart,
  'shopping-bag': ShoppingBag,
  home: Home,
  car: Car,
  zap: Zap,
  film: Film,
  'heart-pulse': HeartPulse,
  plane: Plane,
  'trending-up': TrendingUp,
  wallet: Wallet,
  laptop: Laptop,
  'arrow-up-right': ArrowUpRight,
  gift: Gift,
  'plus-circle': PlusCircle,
  'shield-check': ShieldCheck,
  bike: Bike,
  compass: Compass,
  target: Target,
  'credit-card': CreditCard,
  banknote: Banknote,
  bank: Building2,
  upi: Smartphone,
  coffee: Coffee,
  fuel: Fuel,
  receipt: Receipt,
  tag: Tag,
};

interface CategoryIconProps {
  iconName: string;
  className?: string;
  color?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ iconName, className = 'w-5 h-5', color }) => {
  const IconComponent = iconMap[iconName.toLowerCase()] || CircleDot;
  return <IconComponent className={className} style={color ? { color } : undefined} />;
};

export const getPaymentIcon = (method: string) => {
  switch (method) {
    case 'UPI':
      return Smartphone;
    case 'Cash':
      return Banknote;
    case 'Credit Card':
    case 'Debit Card':
      return CreditCard;
    case 'Net Banking':
      return Building2;
    default:
      return Wallet;
  }
};
