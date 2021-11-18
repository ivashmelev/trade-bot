import { binanceWebsocket } from '../../../binance';
import { Order } from '../../interfaces';
import { StopLossRepository } from '..';
import { Event, ExecutionReportEvent, OrderDto, OrderStatus, OrderType, Side } from '../../types';
import { defineWebsocketEvent } from '../../utils';

export class CommonOrderAdapterForStopLossRepositoryCleaner implements Order {
  private order: Order;
  private stopLossRepository: StopLossRepository;
  orderResponse: OrderDto | null;

  constructor(order: Order, stopLossRepository: StopLossRepository) {
    this.order = order;
    this.stopLossRepository = stopLossRepository;
    this.orderResponse = null;
  }

  async expose(side: Side, _price: number, _quantity: string, type: OrderType): Promise<OrderDto> {
    const order = await this.order.expose(
      side,
      this.stopLossRepository.averagePrice,
      this.stopLossRepository.amountQuantity,
      type
    );

    const handleWebsocketEvent = (e: unknown) => {
      const event = defineWebsocketEvent(e) as ExecutionReportEvent;

      if (event.eventType === Event.ExecutionReport) {
        switch (event.orderStatus) {
          case OrderStatus.Filled: {
            if (order.orderId === event.orderId) {
              this.orderResponse = null;
              void this.stopLossRepository.clear();
              binanceWebsocket.removeEventListener('message', handleWebsocketEvent);
            }

            break;
          }
        }
      }
    };

    binanceWebsocket.addEventListener('message', handleWebsocketEvent);

    this.orderResponse = order;

    return order;
  }

  async cancel(): Promise<void> {
    return await this.order.cancel();
  }
}
