import { binanceWebsocket } from '../../../binance';
import { Order } from '../../interfaces';
import { StopLossRepository } from '..';
import { Event, ExecutionReportEvent, OrderDto, OrderStatus, OrderType, Side } from '../../types';
import { defineWebsocketEvent } from '../../utils';

export class CommonOrderAdapterForStopLossRepositoryCleaner implements Order {
  private order: Order;
  private stopLossRepository: StopLossRepository;

  constructor(order: Order, stopLossRepository: StopLossRepository) {
    this.order = order;
    this.stopLossRepository = stopLossRepository;
  }

  async expose(side: Side, price: number, quantity: string, type: OrderType): Promise<OrderDto> {
    const order = await this.order.expose(side, price, quantity, type);

    const handleWebsocketEvent = (e: unknown) => {
      const event = defineWebsocketEvent(e) as ExecutionReportEvent;

      if (event.eventType === Event.ExecutionReport) {
        switch (event.orderStatus) {
          case OrderStatus.Filled: {
            if (order.orderId === event.orderId) {
              void this.stopLossRepository.clear();
              binanceWebsocket.removeEventListener('message', handleWebsocketEvent);
            }

            break;
          }
        }
      }
    };

    binanceWebsocket.addEventListener('message', handleWebsocketEvent);

    return order;
  }

  async cancel(order: OrderDto): Promise<void> {
    return await this.order.cancel(order);
  }
}
