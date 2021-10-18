import { StopLossOrder } from '.prisma/client';
import prisma from '../database';

export class StopLossSaver {
  async save(data: Omit<StopLossOrder, 'id'>) {
    prisma.stopLossOrder.create({ data });
  }
}
