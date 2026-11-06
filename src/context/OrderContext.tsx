import React, { ReactNode, createContext, useContext, useState } from 'react';

import type { CartItem } from './CartContext';

export type FulfilmentMethod = 'Delivery' | 'Click & Collect';
export type PaymentMethod = 'Card payment' | 'Digital wallet';

export type Order = {
  orderNumber: string;
  itemCount: number;
  subtotal: number;
  deliveryFee: number;
  total: number;
  fulfilment: FulfilmentMethod;
  timeWindow: string;
  paymentMethod: PaymentMethod;
  placedOn: string;
  status: 'Preparing';
};

type NewOrder = {
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  fulfilment: FulfilmentMethod;
  timeWindow: string;
  paymentMethod: PaymentMethod;
};

type OrderContextValue = {
  orders: Order[];
  latestOrder: Order | null;
  monthlySpend: number;
  placeOrder: (details: NewOrder) => Order;
};

const OrderContext = createContext<OrderContextValue | undefined>(undefined);

export function OrderProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);

  const placeOrder = (details: NewOrder) => {
    const itemCount = details.items.reduce((sum, item) => sum + item.quantity, 0);
    const order: Order = {
      orderNumber: `BF-${String(2048 + orders.length).padStart(4, '0')}`,
      itemCount,
      subtotal: details.subtotal,
      deliveryFee: details.deliveryFee,
      total: details.subtotal + details.deliveryFee,
      fulfilment: details.fulfilment,
      timeWindow: details.timeWindow,
      paymentMethod: details.paymentMethod,
      placedOn: new Date().toLocaleDateString('en-AU', {
        day: 'numeric',
        month: 'short',
      }),
      status: 'Preparing',
    };

    setOrders((current) => [order, ...current]);
    return order;
  };

  const monthlySpend = orders.reduce((sum, order) => sum + order.total, 0);

  return (
    <OrderContext.Provider
      value={{ orders, latestOrder: orders[0] ?? null, monthlySpend, placeOrder }}
    >
      {children}
    </OrderContext.Provider>
  );
}

export function useOrders() {
  const value = useContext(OrderContext);
  if (!value) {
    throw new Error('useOrders must be used within OrderProvider');
  }
  return value;
}
