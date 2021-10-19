import prisma from '../../database';
import { StopLossEntity } from '../types';

interface IStopLossRepository {
  orders: StopLossEntity[];
  save: (data: StopLossEntity) => Promise<void>;
  clear: () => Promise<void>;
}

export class StopLossRepository implements IStopLossRepository {
  orders: StopLossEntity[];

  constructor() {
    (async () => {
      this.orders = await prisma.stopLossOrder.findMany();
    })();
  }

  async save(data: StopLossEntity) {
    try {
      await prisma.stopLossOrder.create({ data });
      this.orders.push(data);
    } catch (error) {
      return Promise.reject(new Error('Stop loss repository error from method save'));
    }
  }

  async clear() {
    try {
      await prisma.stopLossOrder.deleteMany();
      this.orders = [];
    } catch (error) {
      return Promise.reject(new Error('Stop loss repository error from method clear'));
    }
  }
}
