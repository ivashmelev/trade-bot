import { Oco, Order, OrderType, Side, SymbolToken } from './types';

export interface IPlacer<T> {
  place: (side: Side, price: number, quantity: string, type?: OrderType) => Promise<T>;
  cancel: (order: T) => Promise<void>;
}

export type IOrderPlacer = IPlacer<Order>;

export type IOcoPlacer = IPlacer<Oco>;

export interface OrderRepository {
  save: (price: string, quantity: string) => Promise<void>;
  clear: () => Promise<void>;
  getStoredOrders: () => Promise<void>;
}

export interface IPriceObserver {
  startGetPrice: (symbol: SymbolToken) => void;
}
