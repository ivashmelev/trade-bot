import { StopLossOrder } from '@prisma/client';
import { binanceRestPrivate } from '../binance';
import prisma from '../database';
import { OrderParams, OrderResponse, OrderType, Side, Symbol, Threshold } from './types';
import { calcValueByPercentage } from './utils';

export class StopLossManager {
  private orders: Omit<StopLossOrder, 'id'>[];
  private threshold: Threshold;
  private symbol: Symbol;
  private limitThreshold: number;

  orderId: number | null;

  constructor(threshold: Threshold, limitThreshold: number, symbol: Symbol) {
    this.orders = [];
    this.orderId = null;
    this.threshold = threshold;
    this.symbol = symbol;
    this.limitThreshold = limitThreshold;

    (async () => {
      this.orders = await prisma.stopLossOrder.findMany();
    })();
  }

  get averagePrice(): number {
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
    return calcValueByPercentage(this.averagePrice, this.threshold.sell.takeProfit + this.limitThreshold);
  }

  private get quantity(): string {
    const amountQuantityStr = String(this.amountQuantity);
    return amountQuantityStr.slice(0, amountQuantityStr.lastIndexOf('.') + 6);
  }

  async save(quantity: string, price: number) {
    const order = {
      quantity,
      price: String(price),
    };

    await prisma.stopLossOrder.create({
      data: order,
    });

    this.orders.push(order);
  }

  async clear() {
    await prisma.stopLossOrder.deleteMany();
    this.orders = [];
  }

  async sellAll() {
    try {
      const response = await binanceRestPrivate.post<{ orderId: number }>('/order', null, {
        params: {
          symbol: this.symbol,
          side: Side.Sell,
          type: OrderType.TakeProfitLimit,
          price: this.price.toFixed(2),
          stopPrice: this.stopPrice.toFixed(2),
          quantity: this.quantity,
          newOrderRespType: OrderResponse.Result,
        } as OrderParams,
      });

      this.orderId = response.data.orderId;

      return response.data;
    } catch (error) {}
  }
}
