import { CommonOrder } from '..';
import { Order } from '../../interfaces';
import { StopLossRepository } from '../../orderRepository';
import { OrderDto, OrderType, Side } from '../../types';

export class CommonOrderAdapterForStopLossRepositorySaver implements Order {
  private commmonOrder: CommonOrder;
  private stopLossRepository: StopLossRepository;

  constructor(order: CommonOrder, stopLossRepository: StopLossRepository) {
    this.commmonOrder = order;
    this.stopLossRepository = stopLossRepository;
  }
  async expose(side: Side, price: number, quantity: string, type: OrderType): Promise<OrderDto> {
    return await this.commmonOrder.expose(side, price, quantity, type);
  }

  async cancel(): Promise<void> {
    await this.commmonOrder.cancel();

    if (this.commmonOrder.order?.side === Side.Sell) {
      await this.stopLossRepository.save(this.commmonOrder.order.price, this.commmonOrder.order.origQty);
    }
  }
}
