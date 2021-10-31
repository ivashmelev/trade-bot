import prisma from '../database';
import { StopLossEntity } from './types';

interface IStopLossRepository {
  orders: StopLossEntity[];
  save: (data: StopLossEntity) => Promise<void>;
  clear: () => Promise<void>;
}

export class StopLossRepository implements IStopLossRepository {
  orders: StopLossEntity[];

  constructor() {
    void (async () => {
      try {
        this.orders = await prisma.stopLossOrder.findMany();
      } catch (error) {
        throw new Error('Error from stop loss repository');
      }
    })();
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
}
