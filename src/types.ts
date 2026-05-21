export interface Product {
  id: string;
  name: string;
  price: number;
  desc: string;
  ing: string[];
  ok: boolean;
  recommended?: boolean;
  spicy?: boolean;
  popular?: boolean;
}

export interface Category {
  id: string;
  name: string;
  note: string;
  items: Product[];
}

export interface CartItem {
  id: string; // Compiled unique id, e.g. productId + adiciones names + note
  productId: string;
  name: string;
  price: number;
  qty: number;
  note: string;
  adiciones: { name: string; price: number }[];
}

export interface CustomerInfo {
  name: string;
  phone: string;
  mesa: string;
  addr: string;
  ot: 'mesa' | 'llevar' | 'domicilio';
  pay: 'Efectivo' | 'Nequi' | 'Bancolombia' | 'Datafono';
}

export interface AppConfig {
  pw: string;
  promo: string;
  promoOn: boolean;
}

export interface TableConfig {
  id: string;
  name: string;
  capacity: number;
  x: number; // For rendering interactive SVG map
  y: number;
}

export interface DeliveryZone {
  id: string;
  name: string;
  cost: number;
  distanceRange: string;
  barrios: string;
  colorHex: string;
}

export interface ActiveOrder {
  id: string;
  time: string;
  itemsCount: number;
  subtotal: number;
  deliveryCost: number;
  discount: number;
  total: number;
  type: 'mesa' | 'llevar' | 'domicilio';
  details: string;
  payMethod: string;
  step: number; // 0: Recibido, 1: En Cocina, 2: En Reparto, 3: Entregado
  customerName: string;
}

export interface CouponConfig {
  code: string;
  type: 'percent' | 'fixed' | 'free_shipping' | 'bogo' | 'specific_product';
  value: number;
  active: boolean;
  bogoBuyQty?: number;          // Cantidad requerida para el descuento (ej: 2)
  bogoFreeQty?: number;         // Cantidad gratis (ej: 1 para un 2x1)
  specificProductId?: string;   // ID del producto al que se aplica el descuento
  specificProductDiscountType?: 'percent' | 'fixed'; // Tipo de descuento para el producto específico
}

export interface DailySchedule {
  dayIndex: number;
  dayLabel: string;
  closed: boolean;
  openTime: string; // HH:MM (24h)
  closeTime: string; // HH:MM (24h)
}


