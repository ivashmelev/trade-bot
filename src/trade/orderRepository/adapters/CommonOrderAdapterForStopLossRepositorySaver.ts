import { Order } from '../../interfaces';
import { StopLossRepository } from '..';
import { OrderDto, OrderType, Side } from '../../types';

export class CommonOrderAdapterForStopLossRepositorySaver implements Order {
  orderResponse: OrderDto | null;
  private order: Order;
  private stopLossRepository: StopLossRepository;

  constructor(order: Order, stopLossRepository: StopLossRepository) {
    this.order = order;
    this.stopLossRepository = stopLossRepository;
  }
  async expose(side: Side, price: number, quantity: string, type: OrderType): Promise<OrderDto> {
    const order = await this.order.expose(side, price, quantity, type);

    this.orderResponse = order;
    return order;
  }

  async cancel(): Promise<void> {
    await this.order.cancel();

    if (this.orderResponse?.side === Side.Sell) {
      await this.stopLossRepository.save(this.orderResponse.price, this.orderResponse.origQty);
    }
  }
}
