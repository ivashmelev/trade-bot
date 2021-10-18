import { UserDataStreamEvent } from 'binance-api-node';
import { binanceWebsocket } from '../binance';
import {
  BalanceUpdateEvent,
  Event,
  ExecutionReportEvent,
  ListStatusEvent,
  OutboundAccountPositionEvent,
} from './types';

export const calcValueByPercentage = (value: number, percentage: number): number => {
  return value + value * (percentage / 100);
};

export const parseExecutionReportEvents = (event: any): ExecutionReportEvent => {
  return {
    eventType: Event.ExecutionReport,
    eventTime: event.E,
    symbol: event.s,
    newClientOrderId: event.c,
    originalClientOrderId: event.C,
    side: event.S,
    orderType: event.o,
    timeInForce: event.f,
    quantity: event.q,
    price: event.p,
    executionType: event.x,
    stopPrice: event.P,
    icebergQuantity: event.F,
    orderStatus: event.X,
    orderRejectReason: event.r,
    orderId: event.i,
    orderTime: event.T,
    lastTradeQuantity: event.l,
    totalTradeQuantity: event.z,
    priceLastTrade: event.L,
    commission: event.n,
    commissionAsset: event.N,
    tradeId: event.t,
    isOrderWorking: event.w,
    isBuyerMaker: event.m,
    creationTime: event.O,
    totalQuoteTradeQuantity: event.Z,
    orderListId: event.g,
    quoteOrderQuantity: event.Q,
    lastQuoteTransacted: event.Y,
  };
};

export const parseOutboundAccountPositionEvent = (event: any): OutboundAccountPositionEvent => {
  return {
    balances: event.B.map((balance: any) => {
      return {
        asset: balance.a,
        free: balance.f,
        locked: balance.l,
      };
    }),
    eventTime: event.E,
    eventType: Event.OutboundAccountPosition,
    lastAccountUpdate: event.u,
  };
};

export const parseBalanceUpdateEvent = (event: any): BalanceUpdateEvent => {
  return {
    asset: event.a,
    balanceDelta: event.d,
    clearTime: event.T,
    eventTime: event.E,
    eventType: Event.BalanceUpdate,
  };
};

export const parseListStatusEvent = (event: any): ListStatusEvent => {
  return {
    eventType: Event.ListStatus,
    eventTime: event.E,
    symbol: event.s,
    orderListId: event.g,
    contingencyType: event.c,
    listStatusType: event.l,
    listOrderStatus: event.L,
    listRejectReason: event.r,
    listClientOrderId: event.C,
    transactionTime: event.T,
    orders: event.O,
  };
};

export const listenOrderStream = (callback: (payload: ExecutionReportEvent) => Promise<void>) => {
  binanceWebsocket.addEventListener('message', (e: MessageEvent<string>) => {
    (async () => {
      const event = JSON.parse(e.data) as { e: Event };

      if (event.e === Event.ExecutionReport) {
        const payload = parseExecutionReportEvents(event);
        await callback(payload);
      }
    })();
  });
};
