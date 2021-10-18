import { StopLossOrder } from '.prisma/client';
import { binanceRestPrivate } from '../binance';
import prisma from '../database';
import { PriceObserver } from './priceObserver';
import { OrderParams, OrderResponse, OrderType, Side, Symbol, Threshold, TimeInForce } from './types';
import { calcValueByPercentage } from './utils';

export class StopLossSeller {
  private priceObserver: PriceObserver;
  private symbol: Symbol;
  private threshold: Threshold;
  sellOrderId: number;
  orders: StopLossOrder[];

  constructor(symbol: Symbol, threshold: Threshold) {
    this.symbol = symbol;
    this.threshold = threshold;

    (async () => {
      this.orders = await prisma.stopLossOrder.findMany();
      this.monitoringPrice();
    })();
  }

  private get averagePrice(): number {
    const sum = this.orders.reduce((prev, value) => {
      return prev + Number(value.price);
    }, 0);

    return sum / this.orders.length;
  }

  private get amountQuantity(): number {
    return this.orders.reduce((prev, value) => {
      return prev + Number(value.quantity);
    }, 0);
  }

  private get price(): number {
    return calcValueByPercentage(this.averagePrice, this.threshold.sell.takeProfit);
  }

  private get stopPrice(): number {
    return calcValueByPercentage(this.averagePrice, this.threshold.sell.takeProfit + this.threshold.limit);
  }

  private get quantity(): string {
    const amountQuantityStr = String(this.amountQuantity);
    return amountQuantityStr.slice(0, amountQuantityStr.lastIndexOf('.') + 6);
  }

  private async sell() {
    try {
      const response = await binanceRestPrivate.post<{ orderId: number }>('/order', null, {
        params: {
          symbol: this.symbol,
          type: OrderType.TakeProfitLimit,
          price: this.price.toFixed(2),
          stopPrice: this.stopPrice.toFixed(2),
          side: Side.Sell,
          quantity: this.quantity,
          newOrderRespType: OrderResponse.Result,
          timeInForce: TimeInForce.Fok,
        } as OrderParams,
      });

      this.sellOrderId = response.data.orderId;
    } catch (error) {}
  }

  private monitoringPrice() {
    setInterval(async () => {
      if (this.priceObserver.price! >= this.stopPrice / 2) {
        await this.sell();
      }
    }, 10 * 1000);
  }

  async clearOrders() {
    await prisma.stopLossOrder.deleteMany();
    this.orders = [];
  }
}
