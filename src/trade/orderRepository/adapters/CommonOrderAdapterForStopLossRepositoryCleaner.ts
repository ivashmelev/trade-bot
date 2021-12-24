import { Order } from '../../interfaces';
import { StopLossRepository } from '..';
import { OrderDto, OrderStatus, OrderType, Side } from '../../types';
import { OrderObserver } from '../../orderObserver';
import interval, { stop } from 'interval-promise';

export class CommonOrderAdapterForStopLossRepositoryCleaner implements Order {
  private order: Order;
  private stopLossRepository: StopLossRepository;
  private orderObserver: OrderObserver;

  constructor(order: Order, stopLossRepository: StopLossRepository, orderObserver: OrderObserver) {
    this.order = order;
    this.stopLossRepository = stopLossRepository;
    this.orderObserver = orderObserver;
  }

  async expose(side: Side, price: number, quantity: string, type: OrderType): Promise<OrderDto> {
    const order = await this.order.expose(side, price, quantity, type);

    await interval(async (_, stop) => await this.handleClearingStopLossRepository(order, stop), 1000);

    return order;
  }

  async cancel(order: OrderDto): Promise<void> {
    return await this.order.cancel(order);
  }

  private async handleClearingStopLossRepository(order: OrderDto, stop: stop): Promise<void> {
    const { status } = await this.orderObserver.getOrder(order);

    if (status === OrderStatus.Filled) {
      stop();
      await this.stopLossRepository.clear();
    }
  }
}
