import { ExecutionReportEvent, Order, OrderStatus, OrderType, Side } from '../types';
import { IOrderPlacer } from '../interfaces';
import { OrderPlacer } from '../placers';
import { StopLossRepository } from '../repositories';
import { defineWebsocketEvent } from '../utils';
import { binanceWebsocket } from '../../binance';

export class StopLossOrderCleaner implements IOrderPlacer {
  private orderPlacer: IOrderPlacer;
  private stopLossRepository: StopLossRepository;
  private activeOrder: Order | null;

  constructor(orderPlacer: OrderPlacer, stopLossRepository: StopLossRepository) {
    this.orderPlacer = orderPlacer;
    this.stopLossRepository = stopLossRepository;
    this.activeOrder = null;
  }

  async place(side: Side, price: number, quantity: string, type: OrderType): Promise<Order> {
    this.activeOrder = await this.orderPlacer.place(side, price, quantity, type);
    binanceWebsocket.addEventListener('message', this.orderStatusListener.bind(this));
    return this.activeOrder;
  }

  async cancel(order: Order): Promise<void> {
    return await this.orderPlacer.cancel(order);
  }

  private orderStatusListener(event: MessageEvent) {
    const payload = defineWebsocketEvent(JSON.parse(event.data)) as ExecutionReportEvent;
    switch (payload.orderStatus) {
      case OrderStatus.Filled: {
        void this.stopLossRepository.clear();
        binanceWebsocket.removeEventListener('message', this.orderStatusListener.bind(this));
        break;
      }
      case OrderStatus.Canceled:
      case OrderStatus.Expired: {
        binanceWebsocket.removeEventListener('message', this.orderStatusListener.bind(this));
        break;
      }
    }
  }
}
