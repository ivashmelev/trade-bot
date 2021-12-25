import { Oco, Order, OrderType, Side, SymbolToken } from './types';

interface Placer<T> {
  expose: (side: Side, price: number, quantity: string, type?: OrderType) => Promise<T>;
  cancel: (order: T) => Promise<void>;
}

export interface IOrderPlacer extends Placer<Order> {
  expose: (side: Side, price: number, quantity: string, type: OrderType) => Promise<Order>;
}

export interface IOcoPlacer extends Placer<Oco> {
  expose: (side: Side, price: number, quantity: string) => Promise<Oco>;
}

export interface OrderRepository {
  save: (price: string, quantity: string) => Promise<void>;
  clear: () => Promise<void>;
  getStoredOrders: () => Promise<void>;
}

export interface IPriceObserver {
  startGetPrice: (symbol: SymbolToken) => Promise<void>;
}

export interface IOrderObserver {
  checkOrder: (order: Order) => Promise<Order>;
  getOpenOrders: () => Promise<Order[]>;
}
