import { Oco, Order, Side } from '../../trade/types';

export interface OrderService {
  place: (side: Side, price: number, quantity: number) => Promise<Order | Oco>;
  cancel: (order: Order | Oco) => Promise<void>;
}
