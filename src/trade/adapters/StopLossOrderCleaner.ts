import { Order, OrderStatus, OrderType, Side } from '../types';
import { IOrderPlacer } from '../interfaces';
import { OrderPlacer } from '../placers';
import { StopLossRepository } from '../repositories';
import { OrderChecker } from '../observers';
import { setIntervalAsync } from '../utils';

export class StopLossOrderCleaner implements IOrderPlacer {
  private orderPlacer: IOrderPlacer;
  private stopLossRepository: StopLossRepository;
  private orderChecker: OrderChecker;
  private timeout: { id: NodeJS.Timeout };

  constructor(orderPlacer: OrderPlacer, stopLossRepository: StopLossRepository, orderChecker: OrderChecker) {
    this.orderPlacer = orderPlacer;
    this.stopLossRepository = stopLossRepository;
    this.orderChecker = orderChecker;
  }

  async expose(side: Side, price: number, quantity: string, type: OrderType): Promise<Order> {
    const order = await this.orderPlacer.expose(side, price, quantity, type);

    this.timeout = await setIntervalAsync(async () => await this.handleClearingStopLossRepository(order), 1000);

    return order;
  }

  async cancel(order: Order): Promise<void> {
    return await this.orderPlacer.cancel(order);
  }

  private async handleClearingStopLossRepository(order: Order): Promise<void> {
    const { status } = await this.orderChecker.check(order);

    if (status === OrderStatus.Filled) {
      await this.stopLossRepository.clear();
      clearTimeout(this.timeout.id);
    }
  }
}
