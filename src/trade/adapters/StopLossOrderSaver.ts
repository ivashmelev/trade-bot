import { Order, OrderType, Side } from '../types';
import { StopLossRepository } from '../orderRepository';
import { IOrderPlacer } from '../interfaces';

export class StopLossOrderSaver implements IOrderPlacer {
  private orderPlacer: IOrderPlacer;
  private stopLossRepository: StopLossRepository;

  constructor(orderPlacer: IOrderPlacer, stopLossRepository: StopLossRepository) {
    this.orderPlacer = orderPlacer;
    this.stopLossRepository = stopLossRepository;
  }

  async expose(side: Side, price: number, quantity: string, type: OrderType): Promise<Order> {
    return await this.orderPlacer.expose(side, price, quantity, type);
  }

  async cancel(order: Order): Promise<void> {
    await this.orderPlacer.cancel(order);

    if (order.side === Side.Sell) {
      await this.stopLossRepository.save(order.price, order.origQty);
    }
  }
}
