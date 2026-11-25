import type { Timestamp } from 'firebase/firestore';

export type Role = 'customer' | 'manager';

export interface Profile {
  id: string;
  displayName: string;
  email: string;
  role: Role;
  createdAt?: Timestamp;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  priceCents: number;
  stock: number;
  minStock: number;
  active: boolean;
  supplier?: string;
  imageUrl?: string;
  imageKey?: string;
  packSize?: string;
  abv?: string;
  description?: string;
  sourceName?: string;
  sourceUrl?: string;
  premium?: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface CartLine {
  productId: string;
  quantity: number;
  packUnits?: number;
}

export type CollectorType = 'self' | 'nominee';

export interface PickupCollector {
  type: CollectorType;
  fullName: string;
  phone?: string;
  idType: string;
}

export interface PickupDetails {
  locationId: string;
  locationName: string;
  locationAddress: string;
  window: string;
  collector: PickupCollector;
  waPickupOnly: true;
  photoIdRequired: true;
  ageConfirmed: true;
}

export type RequestStatus = 'pending' | 'completed' | 'declined';

export interface CollectionRequest extends Partial<PickupDetails> {
  id: string;
  userId: string;
  items: CartLine[];
  status: RequestStatus;
  createdAt?: Timestamp;
  processedAt?: Timestamp;
  totalCents?: number;
}

export interface SaleLine {
  productId: string;
  name: string;
  quantity: number;
  priceCents: number;
  packUnits?: number;
  packLabel?: string;
}

export interface Sale {
  id: string;
  requestId: string;
  userId: string;
  items: SaleLine[];
  totalCents: number;
  fulfilledBy: string;
  createdAt?: Timestamp;
}

export interface Movement {
  id: string;
  productId: string;
  delta: number;
  reason: string;
  userId: string;
  createdAt?: Timestamp;
}

export interface Supplier {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export interface StoreSettings {
  supportEmail?: string;
  supportPhone?: string;
  shopName?: string;
}
