interface OrderTypeThreshold {
  takeProfit: number;
  stopLoss: number;
}

export interface Threshold {
  buy: OrderTypeThreshold;
  sell: OrderTypeThreshold;
}

export enum Side {
  Buy = 'BUY',
  Sell = 'SELL',
}

interface Balance {
  asset: string;
  free: string;
  locked: string;
}

export interface AccountInfo {
  makerCommission: number;
  takerCommission: number;
  buyerCommission: number;
  sellerCommission: number;
  canTrade: boolean;
  canWithdraw: boolean;
  canDeposit: boolean;
  updateTime: number;
  accountType: 'SPOT';
  balances: Balance[];
  permissions: ['SPOT'];
}

export enum Symbol {
  Btcusdt = 'BTCUSDT',
}

export enum Event {
  ExecutionReport = 'executionReport',
  BalanceUpdate = 'balanceUpdate',
  OutboundAccountPosition = 'outboundAccountPosition',
  ListStatus = 'listStatus',
}

export enum OrderType {
  TakeProfitLimit = 'TAKE_PROFIT_LIMIT',
  StopLossLimit = 'STOP_LOSS_LIMIT',
  Limit = 'LIMIT',
  Market = 'MARKET',
  StopLoss = 'STOP_LOSS',
  TakeProfit = 'TAKE_PROFIT',
  LimitMaker = 'LIMIT_MAKER',
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

enum ExecutionType {
  New = 'NEW',
  Canceled = 'CANCELED',
  Replaced = 'REPLACED',
  Rejected = 'REJECTED',
  Trade = 'TRADE',
  Expired = 'EXPIRED',
}

export enum TimeInForce {
  Gtc = 'GTC',
  Ioc = 'IOC',
  Fok = 'FOK',
}

interface OutboundAccountPositionEvent {
  e: Event.OutboundAccountPosition;
  E: number; //Event Time
  u: number; //Time of last account update
  B: //Balances Array
  {
    a: string; //Asset
    f: string; //Free
    l: string; //Locked
  }[];
}

interface BalanceUpdateEvent {
  e: Event.BalanceUpdate;
  E: number; //Event Time
  a: string; //Asset
  d: string; //Balance Delta
  T: number; //Clear Time
}

interface ExecutionReportEvent {
  e: Event.ExecutionReport;
  /**
   * Event time
   */
  E: number;
  /**
   * Symbol
   */
  s: Symbol; //
  /**
   * Client order ID
   */
  c: string; //
  /**
   * Side
   */
  S: Side; //
  /**
   * Order type
   */
  o: OrderType; //
  f: TimeInForce; // Time in force
  q: string; // Order quantity
  p: string; // Order price
  P: string; // Stop price
  F: string; // Iceberg quantity
  g: number; // OrderListId
  C: string; // Original client order ID; This is the ID of the order being canceled
  x: ExecutionType; // Current execution type
  X: OrderStatus; // Current order status
  r: string; // Order reject reason; will be an error code.
  i: number; // Order ID
  l: string; // Last executed quantity
  z: string; // Cumulative filled quantity
  L: string; // Last executed price
  n: string; // Commission amount
  N: string; // Commission asset
  T: number; // Transaction time
  t: number; // Trade ID
  I: number; // Ignore
  w: boolean; // Is the order on the book?
  m: boolean; // Is this trade the maker side?
  M: boolean; // Ignore
  O: number; // Order creation time
  Z: string; // Cumulative quote asset transacted quantity
  Y: string; // Last quote asset transacted quantity (i.e. lastPrice * lastQty)
  Q: string; // Quote Order Qty
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
interface ListStatus {
  e: Event.ListStatus;
  E: number;
  s: Symbol;
  g: number;
  c: 'OCO';
  l: ListStatusType;
  L: ListOrderStatus;
  r: 'NONE';
  C: string;
  T: number;
  O: { s: Symbol; i: number; c: string }[];
}

export type Payload = OutboundAccountPositionEvent | BalanceUpdateEvent | ExecutionReportEvent | ListStatus;

export enum OrderResponse {
  Ack = 'ACK',
  Result = 'RESULT',
  Full = 'FULL',
}

export interface OcoParams {
  symbol: Symbol;
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
  newOrderRespType?: OrderResponse; //	Set the response JSON.
}

export interface OrderParams {
  symbol: Symbol;
  type: OrderType;
  stopPrice: string;
  side: Side;
  quantity: string;
  price: string;
  newOrderRespType: OrderResponse;
}

export interface CoincapRate {
  data: {
    id: string;
    symbol: string;
    currencySymbol: string;
    type: string;
    rateUsd: string;
  };
  timestamp: number;
}

export interface CancelOcoParams {
  symbol: Symbol;
  orderListId: number; //	Either orderListId or listClientOrderId must be provided
  listClientOrderId?: string; // Either orderListId or listClientOrderId must be provided
  newClientOrderId?: string; // Used to uniquely identify this cancel. Automatically generated by default
}
