import { OrderDto, OrderType, Side } from './types';

export interface Order {
  expose: (side: Side, price: number, quantity: string, type?: OrderType) => Promise<OrderDto>;
  cancel: (order: OrderDto) => Promise<void>;
}

export interface PriceObserver {
  updatePrice: (pricePublisher: PricePublisher) => void;
}
export interface PricePublisher {
  price: number;
  subscribe: (observer: PriceObserver) => void;
  unsubscribe: (observer: PriceObserver) => void;
  notify: () => void;
}
