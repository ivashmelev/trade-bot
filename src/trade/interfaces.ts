import { Oco, Order, OrderType, Side, SymbolToken } from './types';

interface Placer<T> {
  place: (side: Side, price: number, quantity: string, type?: OrderType) => Promise<T>;
  cancel: (order: T) => Promise<void>;
}

export interface Checker<T> {
  check: (arg: T) => Promise<T>;
}

export interface IOrderPlacer extends Placer<Order> {
  place: (side: Side, price: number, quantity: string, type: OrderType) => Promise<Order>;
}

export interface IOcoPlacer extends Placer<Oco> {
  place: (side: Side, price: number, quantity: string) => Promise<Oco>;
}

export interface OrderRepository {
  save: (price: string, quantity: string) => Promise<void>;
  clear: () => Promise<void>;
  getStoredOrders: () => Promise<void>;
}

export interface IPriceObserver {
  startGetPrice: (symbol: SymbolToken) => void;
}
