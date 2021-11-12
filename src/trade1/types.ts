export enum SymbolToken {
  Btcusdt = 'BTCUSDT',
}

export enum Side {
  Buy = 'BUY',
  Sell = 'SELL',
}

export enum TimeInForce {
  Gtc = 'GTC',
  Ioc = 'IOC',
  Fok = 'FOK',
}

export enum OrderStatus {
  New = 'NEW',
  PartiallyFilled = 'PARTIALLY_FILLED',
  Filled = 'FILLED',
  Canceled = 'CANCELED',
  PendingCancel = 'PENDING_CANCEL',
  Rejected = 'REJECTED',
  Expired = 'EXPIRED',
}

export enum OrderType {
  TakeProfitLimit = 'TAKE_PROFIT_LIMIT',
  StopLossLimit = 'STOP_LOSS_LIMIT',
  // Limit = 'LIMIT',
  // Market = 'MARKET',
  // StopLoss = 'STOP_LOSS',
  // TakeProfit = 'TAKE_PROFIT',
  // LimitMaker = 'LIMIT_MAKER',
}

type OrderTypeThreshold = Record<OrderType, number>;

export type Threshold = Record<Side, OrderTypeThreshold> & { limit: number };

export interface Order {
  clientOrderId: string;
  cummulativeQuoteQty: string;
  executedQty: string;
  icebergQty?: string;
  orderId: number;
  orderListId: number;
  origQty: string;
  price: string;
  side: Side;
  status: OrderStatus;
  stopPrice?: string;
  symbol: string;
  timeInForce: TimeInForce;
  transactTime: number;
  type: OrderType;
  fills?: unknown[];
}
