export enum SymbolToken {
  Btcusdt = 'BTCUSDT',
}

export enum Side {
  Buy = 'BUY',
  Sell = 'SELL',
}

export enum OrderStatus {
  New = 'NEW',
  Filled = 'FILLED',
  Canceled = 'CANCELED',
  PendingCancel = 'PENDING_CANCEL',
  Rejected = 'REJECTED',
  Expired = 'EXPIRED',
}

export enum TimeInForce {
  Gtc = 'GTC',
  Ioc = 'IOC',
  Fok = 'FOK',
}

export enum OrderType {
  TakeProfitLimit = 'TAKE_PROFIT_LIMIT',
  StopLossLimit = 'STOP_LOSS_LIMIT',
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

enum ListStatusType {
  Response = 'RESPONSE',
  ExecStarted = 'EXEC_STARTED',
  AllDone = 'ALL_DONE',
}

enum ListOrderStatus {
  Executing = 'EXECUTING',
  AllDone = 'ALL_DONE',
  Reject = 'REJECT',
}

export interface Oco {
  orderListId: number;
  contingencyType: 'OCO';
  listStatusType: ListStatusType;
  listOrderStatus: ListOrderStatus;
  listClientOrderId: string;
  transactionTime: number;
  symbol: string;
  orders: Order[];
  orderReports: Order[];
}

export enum OrderResponseType {
  Ack = 'ACK',
  Result = 'RESULT',
  Full = 'FULL',
}

export interface OcoRequest {
  symbol: SymbolToken;
  listClientOrderId?: string; //A unique Id for the entire orderList
  side: Side;
  quantity: string;
  limitClientOrderId?: string; //A unique Id for the limit order
  price: string;
  limitIcebergQty?: string;
  stopClientOrderId?: string; //A unique Id for the stop loss/stop loss limit leg
  stopPrice: string;
  stopLimitPrice: string; //	If provided, stopLimitTimeInForce is required.
  stopIcebergQty?: string;
  stopLimitTimeInForce?: TimeInForce; //	Valid values are GTC/FOK/IOC
  newOrderRespType?: OrderResponseType; //	Set the response JSON.
}

export interface OrderRequest {
  symbol: SymbolToken;
  type: OrderType;
  stopPrice: string;
  side: Side;
  quantity: string;
  price: string;
  newOrderRespType: OrderResponseType;
  timeInForce: TimeInForce;
}

export enum Event {
  ExecutionReport = 'executionReport',
  BalanceUpdate = 'balanceUpdate',
  OutboundAccountPosition = 'outboundAccountPosition',
  ListStatus = 'listStatus',
}

enum ExecutionType {
  New = 'NEW',
  Canceled = 'CANCELED',
  Replaced = 'REPLACED',
  Rejected = 'REJECTED',
  Trade = 'TRADE',
  Expired = 'EXPIRED',
}

export interface ExecutionReportEvent {
  commission: string; // Commission amount
  commissionAsset: string | null; // Commission asset
  creationTime: number; // Order creation time
  eventTime: number;
  eventType: Event.ExecutionReport;
  executionType: ExecutionType; // Current execution type
  icebergQuantity: string; // Iceberg quantity
  isBuyerMaker: boolean; // Is this trade the maker side?
  isOrderWorking: boolean; // Is the order on the book?
  lastQuoteTransacted: string; // Last quote asset transacted quantity (i.e. lastPrice * lastQty);
  lastTradeQuantity: string; // Last executed quantity
  newClientOrderId: string; // Client order ID
  orderId: number; // Order ID
  orderListId: number; // OrderListId
  orderRejectReason: string; // Order reject reason; will be an error code.
  orderStatus: OrderStatus; // Current order status
  orderTime: number; // Transaction time
  orderType: OrderType; // Order type
  originalClientOrderId: string | null; // Original client order ID; This is the ID of the order being canceled
  price: string; // Order price
  priceLastTrade: string; // Last executed price
  quantity: string; // Order quantity
  quoteOrderQuantity: string; // Quote Order Qty
  side: Side; // Side
  stopPrice: string; // Stop price
  symbol: string; // Symbol
  timeInForce: TimeInForce; // Time in force
  totalQuoteTradeQuantity: string; // Cumulative quote asset transacted quantity
  totalTradeQuantity: string; // Cumulative filled quantity
  tradeId: number; // Trade ID
}

export interface MiniTicker {
  eventType: '24hrMiniTicker';
  eventTime: number;
  symbol: SymbolToken;
  closePrice: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  volumeQuote: string;
}

export interface OrderResponseError {
  code: number;
  msg: string;
}

export enum OrderErrorMessage {
  InsufficientBalance = 'Account has insufficient balance for requested action.',
  TriggerImmediately = 'Order would trigger immediately.',
}

export interface AccountInformation {
  makerCommission: number;
  takerCommission: number;
  buyerCommission: number;
  sellerCommission: number;
  canTrade: boolean;
  canWithdraw: boolean;
  canDeposit: boolean;
  updateTime: number;
  accountType: 'SPOT';
  balances: {
    asset: string;
    free: string;
    locked: string;
  }[];
  permissions: ['SPOT'];
}

export enum BalanceAssets {
  Usdt = 'USDT',
  Btc = 'Btc',
}
