import { CommonOrder } from '..';
import { binanceWebsocket } from '../../../binance';
import { StopLossRepository } from '../../orderRepository';
import {
  Event,
  ExecutionReportEvent,
  OrderDto,
  OrderStatus,
  OrderType,
  Side,
  SymbolToken,
  Threshold,
} from '../../types';
import { defineWebsocketEvent } from '../../utils';

export class StopLossRepositoryCleanerToCommonOrderAdapter extends CommonOrder {
  private stopLossRepository: StopLossRepository;

  constructor(stopLossRepository: StopLossRepository, symbol: SymbolToken, threshold: Threshold) {
    super(symbol, threshold);
    this.stopLossRepository = stopLossRepository;
  }

  async expose(side: Side, _price: number, _quantity: string, type: OrderType): Promise<OrderDto> {
    const order = await super.expose(
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
          }
        }
      }
    };

    binanceWebsocket.addEventListener('message', handleWebsocketEvent);

    return order;
  }
}
