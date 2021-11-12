import { Order, OrderType, Side, SymbolToken, TimeInForce } from '../types';

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

export enum OrderResponse {
  Ack = 'ACK',
  Result = 'RESULT',
  Full = 'FULL',
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
