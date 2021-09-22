import { Order, OrderSide, OrderType } from 'binance-api-node';

export enum SymbolOrder {
  BTCUSDT = 'BTCUSDT',
}

export interface ExposeOrderParams {
  price: number;
  threshold: number;
  type: OrderType;
  side: OrderSide;
  quantity: string;
}

export interface MarketStateUpdateParams {
  percentageDiff?: number;
  activeOrder?: Order | null;
  side?: OrderSide;
}

export enum State {
  Pending = 'PENDING',
  Received = 'RECEIVED',
  Rejected = 'REJECTED',
}
