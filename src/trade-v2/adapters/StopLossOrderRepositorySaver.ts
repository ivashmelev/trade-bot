import { OrderService } from '../OrderService/types';
import { Oco, Order, Side } from '../../trade/types';
import { StopLossOrderRepository } from '../OrderRepository/StopLossOrderRepository';

/**
 * При отмене сохраняет стоп-лосс ордер в таблицу
 */
export class StopLossOrderRepositorySaver implements OrderService {
  private orderService: OrderService;
  private stopLossOrderRepository: StopLossOrderRepository;

  constructor(orderService: OrderService, stopLossOrderRepository: StopLossOrderRepository) {
    this.orderService = orderService;
    this.stopLossOrderRepository = stopLossOrderRepository;
  }

  async place(side: Side, price: number, quantity: number): Promise<Order | Oco> {
    return await this.orderService.place(side, price, quantity);
  }

  async cancel(order: Order | Oco): Promise<void> {
    await this.orderService.cancel(order);

    if ('side' in order) {
      if (order.side === Side.Sell) {
        await this.stopLossOrderRepository.save(order.price, order.origQty);
      }
    }
  }
}
