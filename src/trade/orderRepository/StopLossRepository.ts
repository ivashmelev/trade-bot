import { StopLossOrder } from '.prisma/client';
import prisma from '../../database';
import { OrderRepository } from '../interfaces';

type Order = Omit<StopLossOrder, 'id'>;

export class StopLossRepository implements OrderRepository {
  private orders: Order[];

  constructor() {
    this.orders = [];
  }

  async getOrders(): Promise<void> {
    try {
      this.orders = await prisma.stopLossOrder.findMany();
    } catch (error) {
      console.log('StopLossRepository error from method getOrders');
      return await this.getOrders();
    }
  }

  async save(price: string, quantity: string): Promise<void> {
    try {
      await prisma.stopLossOrder.create({ data: { price, quantity } });
      this.orders.push({ price, quantity });
    } catch (error) {
      console.log('StopLossRepository error from method save');
      return await this.save(price, quantity);
    }
  }

  async clear(): Promise<void> {
    try {
      await prisma.stopLossOrder.deleteMany();
      this.orders = [];
    } catch (error) {
      console.log('StopLossRepository error from method clear');
      return await this.clear();
    }
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
}
