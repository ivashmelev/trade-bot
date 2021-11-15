/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ExecutionReportEvent, OrderType, Side, Threshold, Event } from './types';

export const calcValueByPercentage = (value: number, percentage: number): number => {
  return value + value * (percentage / 100);
};

export const getPrice = (
  threshold: Threshold,
  side: Side,
  type: OrderType,
  price: number,
  isLimit: boolean
): string => {
  const percentage = threshold[side][type];
  const percentageWithLimitThreshold = Math.abs(
    Math.sign(percentage) > 0 ? percentage + threshold.limit : percentage - threshold.limit
  );

  if (isLimit) {
    return calcValueByPercentage(price, percentageWithLimitThreshold).toFixed(2);
  }
  return calcValueByPercentage(price, percentage).toFixed(2);
};

export const setIntervalAsync = async (callback: () => Promise<void>, ms: number): Promise<void> => {
  await callback();
  setTimeout(() => setIntervalAsync(callback, ms), ms);
};

export const parseExecutionReportEvents = (event: any): ExecutionReportEvent => {
  return {
    eventType: event.e,
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

export const defineWebsocketEvent = (event: any) => {
  switch (event.e) {
    case Event.ExecutionReport: {
      return parseExecutionReportEvents(event);
    }

    default:
      return event;
  }
};
