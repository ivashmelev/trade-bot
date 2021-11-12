import { StopLossOrder } from '@prisma/client';
import { SymbolToken } from '../types';

export type StopLossEntity = Omit<StopLossOrder, 'id'>;

export interface OrderStatusCheckParams {
  symbol: SymbolToken;
  orderId: number;
}
