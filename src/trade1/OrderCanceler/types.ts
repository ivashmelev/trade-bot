import { Order } from '../types';

export interface CancellationRecord {
  order: Order;
  price: number;
}
