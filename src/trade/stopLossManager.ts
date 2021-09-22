import { StopLossOrder } from '@prisma/client';
import { Order } from 'binance-api-node';
import prisma from '../database';

export class StopLossManager {
  private orders: Omit<StopLossOrder, 'id'>[];
  activeOrder: Order | null;

  constructor() {
    this.orders = [];
    prisma.stopLossOrder.findMany().then((orders) => (this.orders = orders));
    this.activeOrder = null;
  }

  get averagePrice(): number {
    const sum = this.orders.reduce((prev, value) => {
      return prev + Number(value.price);
    }, 0);

    return sum / this.orders.length;
  }

  get amountQuantity(): number {
    return this.orders.reduce((prev, value) => {
      return prev + Number(value.quantity);
    }, 0);
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
}
