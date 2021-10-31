import { StopLossOrder } from '@prisma/client';

interface OrderTypeThreshold {
  takeProfit: number;
  stopLoss: number;
}

export interface Threshold {
  buy: OrderTypeThreshold;
  sell: OrderTypeThreshold;
  limit: number;
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

export enum SymbolToken {
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

export interface OutboundAccountPositionEvent {
  balances: Balance[];
  eventTime: number;
  eventType: Event.OutboundAccountPosition;
  lastAccountUpdate: number;
}

export interface BalanceUpdateEvent {
  asset: string;
  balanceDelta: string;
  clearTime: number;
  eventTime: number;
  eventType: Event.BalanceUpdate;
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
export interface ListStatusEvent {
  eventType: Event.ListStatus;
  eventTime: number;
  symbol: SymbolToken;
  orderListId: number;
  contingencyType: 'OCO';
  listStatusType: ListStatusType;
  listOrderStatus: ListOrderStatus;
  listRejectReason: 'NONE';
  listClientOrderId: string;
  transactionTime: number;
  orders: { symbol: SymbolToken; orderId: number; clientOrderId: string }[];
}

export type Payload = OutboundAccountPositionEvent | BalanceUpdateEvent | ExecutionReportEvent | ListStatusEvent;

export enum OrderResponse {
  Ack = 'ACK',
  Result = 'RESULT',
  Full = 'FULL',
}

export interface OcoParams {
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
  newOrderRespType?: OrderResponse; //	Set the response JSON.
}

export interface OrderParams {
  symbol: SymbolToken;
  type: OrderType;
  stopPrice: string;
  side: Side;
  quantity: string;
  price: string;
  newOrderRespType: OrderResponse;
  timeInForce: TimeInForce;
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
  symbol: SymbolToken;
  orderListId: number; //	Either orderListId or listClientOrderId must be provided
  listClientOrderId?: string; // Either orderListId or listClientOrderId must be provided
  newClientOrderId?: string; // Used to uniquely identify this cancel. Automatically generated by default
}

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

export type StopLossEntity = Omit<StopLossOrder, 'id'>;

export interface BinanceRequestError {
  code: number;
  msg: string;
}
