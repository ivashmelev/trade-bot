import { CommonOrder } from '..';
import { binanceWebsocket } from '../../../binance';
import { Order } from '../../interfaces';
import { StopLossRepository } from '../../orderRepository';
import { Event, ExecutionReportEvent, OrderDto, OrderStatus, OrderType, Side } from '../../types';
import { defineWebsocketEvent } from '../../utils';

export class CommonOrderAdapterForStopLossRepositoryCleaner implements Order {
  private commonOrder: CommonOrder;
  private stopLossRepository: StopLossRepository;

  constructor(commonOrder: CommonOrder, stopLossRepository: StopLossRepository) {
    this.commonOrder = commonOrder;
    this.stopLossRepository = stopLossRepository;
  }

  async expose(side: Side, _price: number, _quantity: string, type: OrderType): Promise<OrderDto> {
    const order = await this.commonOrder.expose(
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

  async cancel(): Promise<void> {
    return await this.commonOrder.cancel();
  }
}
