import { Order, OrderStatus, OrderType, Side } from '../types';
import interval, { stop } from 'interval-promise';
import { IOrderPlacer } from '../interfaces';
import { OrderPlacer } from '../placers';
import { StopLossRepository } from '../repositories';
import { OrderObserver } from '../observers';

export class StopLossOrderCleaner implements IOrderPlacer {
  private orderPlacer: IOrderPlacer;
  private stopLossRepository: StopLossRepository;
  private orderObserver: OrderObserver;

  constructor(orderPlacer: OrderPlacer, stopLossRepository: StopLossRepository, orderObserver: OrderObserver) {
    this.orderPlacer = orderPlacer;
    this.stopLossRepository = stopLossRepository;
    this.orderObserver = orderObserver;
  }

  async expose(side: Side, price: number, quantity: string, type: OrderType): Promise<Order> {
    const order = await this.orderPlacer.expose(side, price, quantity, type);

    await interval(async (_, stop) => await this.handleClearingStopLossRepository(order, stop), 1000);

    return order;
  }

  async cancel(order: Order): Promise<void> {
    return await this.orderPlacer.cancel(order);
  }

  private async handleClearingStopLossRepository(order: Order, stop: stop): Promise<void> {
    const { status } = await this.orderObserver.checkOrder(order);

    if (status === OrderStatus.Filled) {
      stop();
      await this.stopLossRepository.clear();
    }
  }
}
