import { Order } from '../../interfaces';
import { StopLossRepository } from '..';
import { OrderDto, OrderType, Side } from '../../types';

export class CommonOrderAdapterForStopLossRepositorySaver implements Order {
  private order: Order;
  private stopLossRepository: StopLossRepository;

  constructor(order: Order, stopLossRepository: StopLossRepository) {
    this.order = order;
    this.stopLossRepository = stopLossRepository;
  }

  async expose(side: Side, price: number, quantity: string, type: OrderType): Promise<OrderDto> {
    const order = await this.order.expose(side, price, quantity, type);

    return order;
  }

  async cancel(order: OrderDto): Promise<void> {
    await this.order.cancel(order);

    if (order.side === Side.Sell) {
      await this.stopLossRepository.save(order.price, order.origQty);
    }
  }
}
