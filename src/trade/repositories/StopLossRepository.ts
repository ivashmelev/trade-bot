import { StopLossOrder } from '.prisma/client';
import prisma from '../../database';
import { OrderRepository } from '../interfaces';

type StopLossOrderWithoutId = Omit<StopLossOrder, 'id'>;

export class StopLossRepository implements OrderRepository {
  private orders: StopLossOrderWithoutId[];

  constructor() {
    this.orders = [];
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

  async getStoredOrders(): Promise<void> {
    try {
      this.orders = await prisma.stopLossOrder.findMany();
    } catch (error) {
      console.log('StopLossRepository error from method getOrders');
      throw error;
    }
  }

  async save(price: string, quantity: string): Promise<void> {
    try {
      await prisma.stopLossOrder.create({ data: { price, quantity } });
      this.orders.push({ price, quantity });
    } catch (error) {
      console.log('StopLossRepository error from method save');
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      await prisma.stopLossOrder.deleteMany();
      this.orders = [];
    } catch (error) {
      console.log('StopLossRepository error from method clear');
      throw error;
    }
  }
}
