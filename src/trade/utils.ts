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

export const setIntervalAsync = async (callback: () => Promise<void>, ms: number): Promise<{ id: NodeJS.Timeout }> => {
  const timeout = { id: undefined as unknown as NodeJS.Timeout };

  const handle = async (): Promise<{ id: NodeJS.Timeout }> => {
    await callback();
    timeout.id = setTimeout(() => handle(), ms);
    return timeout;
  };

  return await handle();
};

export const parseExecutionReportEvents = (event: any): ExecutionReportEvent => {
  const payload = JSON.parse(event.data);

  return {
    eventType: payload.e,
    eventTime: payload.E,
    symbol: payload.s,
    newClientOrderId: payload.c,
    originalClientOrderId: payload.C,
    side: payload.S,
    orderType: payload.o,
    timeInForce: payload.f,
    quantity: payload.q,
    price: payload.p,
    executionType: payload.x,
    stopPrice: payload.P,
    icebergQuantity: payload.F,
    orderStatus: payload.X,
    orderRejectReason: payload.r,
    orderId: payload.i,
    orderTime: payload.T,
    lastTradeQuantity: payload.l,
    totalTradeQuantity: payload.z,
    priceLastTrade: payload.L,
    commission: payload.n,
    commissionAsset: payload.N,
    tradeId: payload.t,
    isOrderWorking: payload.w,
    isBuyerMaker: payload.m,
    creationTime: payload.O,
    totalQuoteTradeQuantity: payload.Z,
    orderListId: payload.g,
    quoteOrderQuantity: payload.Q,
    lastQuoteTransacted: payload.Y,
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
