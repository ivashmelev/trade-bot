import { OrderDto, OrderType, Side } from './types';

export interface Order {
  expose: (side: Side, price: number, quantity: string, type?: OrderType) => Promise<OrderDto>;
  cancel: (order: OrderDto) => Promise<void>;
}
