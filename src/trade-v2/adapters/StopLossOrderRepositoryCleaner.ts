import { OrderService } from '../OrderService/types';
import { ExecutionReportEvent, Oco, Order, OrderStatus, Side } from '../../trade/types';
import { binance } from '../../binance';
import { defineWebsocketEvent } from '../../trade/utils';
import { StopLossOrderRepository } from '../OrderRepository/StopLossOrderRepository';

/**
 * Очищает таблицу стоп-лосс ордеров
 */
export class StopLossOrderRepositoryCleaner implements OrderService {
  private orderService: OrderService;
  private stopLossOrderRepository: StopLossOrderRepository;
  private activeOrder: Order | null;

  constructor(orderService: OrderService, stopLossOrderRepository: StopLossOrderRepository) {
    this.orderService = orderService;
    this.stopLossOrderRepository = stopLossOrderRepository;
    this.activeOrder = null;
  }

  async place(side: Side, price: number, quantity: number): Promise<Order> {
    this.activeOrder = (await this.orderService.place(side, price, quantity)) as Order;
    binance.websocket.addEventListener('message', this.orderStatusListener.bind(this));
    return this.activeOrder;
  }

  async cancel(order: Order | Oco): Promise<void> {
    return await this.orderService.cancel(order);
  }

  /**
   * Подписывается на сообщения вебсокета
   * @param event Сообщение
   */
  private orderStatusListener(event: MessageEvent) {
    const payload = defineWebsocketEvent(JSON.parse(event.data)) as ExecutionReportEvent;

    switch (payload.orderStatus) {
      case OrderStatus.Filled: {
        void this.stopLossOrderRepository.clear();
        binance.websocket.removeEventListener('message', this.orderStatusListener.bind(this));
        break;
      }
      case OrderStatus.Canceled:
      case OrderStatus.Expired: {
        binance.websocket.removeEventListener('message', this.orderStatusListener.bind(this));
        break;
      }
    }
  }
}
