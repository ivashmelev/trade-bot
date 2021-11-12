import chalk from 'chalk';
import { binanceRestPrivate } from '../../binance';
import prisma from '../../database';
import { Order, OrderStatus, SymbolToken } from '../types';
import { OrderStatusCheckParams, StopLossEntity } from './types';

export class StopLossRepository {
  private symbol: SymbolToken;
  activeOrder: Order | null;
  orders: StopLossEntity[];
  isOrderPlaced: boolean;

  constructor(symbol: SymbolToken) {
    this.symbol = symbol;
    this.isOrderPlaced = false;
    this.orders = [];
    this.activeOrder = null;

    void (async () => {
      try {
        this.orders = await prisma.stopLossOrder.findMany();
      } catch (error) {
        throw new Error('Error from stop loss repository');
      }
    })();
  }

  get averagePrice(): number {
    const sum = this.orders.reduce((prev, value) => {
      return prev + Number(value.price);
    }, 0);

    return sum / this.orders.length;
  }

  get amountQuantity(): string {
    const quantity = this.orders.reduce((prev, value) => {
      return prev + Number(value.quantity);
    }, 0);

    const quantityStr = String(quantity);
    return quantityStr.slice(0, quantityStr.lastIndexOf('.') + 6);
  }

  async save(data: StopLossEntity): Promise<void> {
    try {
      await prisma.stopLossOrder.create({ data });
      this.orders.push(data);
    } catch (error) {
      return Promise.reject(new Error('Stop loss repository error from method save'));
    }
  }

  async clear(): Promise<void> {
    try {
      await prisma.stopLossOrder.deleteMany();
      this.orders = [];
    } catch (error) {
      return Promise.reject(new Error('Stop loss repository error from method clear'));
    }
  }

  async startCheckStatusOrder(): Promise<void> {
    if (this.isOrderPlaced) {
      try {
        const response = await binanceRestPrivate.get<Order>('/order', {
          params: {
            symbol: this.symbol,
            orderId: this.activeOrder?.orderId,
          } as OrderStatusCheckParams,
        });

        if (response.data.status === OrderStatus.Filled) {
          await this.clear();
          this.isOrderPlaced = false;
          console.log(chalk.bgGreen(`FILLED STOP LOSS ORDER ${response.data.orderId}`));
        } else if (response.data.status === OrderStatus.Canceled) {
          this.isOrderPlaced = false;
          console.log(chalk.bgRed(`CANCEL STOP LOSS ORDER ${response.data.orderId}`));
        }
      } catch (error) {
        return Promise.reject(new Error('Order placer error from method placeOrder'));
      }
    }
  }
}
