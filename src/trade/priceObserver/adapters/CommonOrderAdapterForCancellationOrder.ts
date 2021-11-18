import { OrderPriceObserver } from '..';
import { OrderDto, OrderStatus, OrderType, Side, Event, ExecutionReportEvent, Threshold } from '../../types';
import { Order } from '../../interfaces';
import { binanceWebsocket } from '../../../binance';
import { calcValueByPercentage, defineWebsocketEvent, setIntervalAsync } from '../../utils';

export class CommonOrderAdapterForСancelingOrder implements Order {
  orderResponse: OrderDto | null;
  private order: Order;
  private orderPriceObserver: OrderPriceObserver;
  private threshold: Threshold;

  constructor(order: Order, orderPriceObserver: OrderPriceObserver, threshold: Threshold) {
    this.orderPriceObserver = orderPriceObserver;
    this.threshold = threshold;
    this.order = order;
  }

  async expose(side: Side, price: number, quantity: string, type: OrderType): Promise<OrderDto> {
    const order = await this.order.expose(side, price, quantity, type);

    this.orderResponse = order;

    let orderTimeot: { id: NodeJS.Timeout };

    const handleWebsocketEvent = (e: unknown) => {
      const event = defineWebsocketEvent(e) as ExecutionReportEvent;

      void (async () => {
        if (event.eventType === Event.ExecutionReport) {
          switch (event.orderStatus) {
            case OrderStatus.New: {
              if (event.orderId === order.orderId) {
                orderTimeot = await setIntervalAsync(async () => await this.handleCancelingOrder(), 1000);
              }
              break;
            }
            case OrderStatus.Filled:
            case OrderStatus.Canceled:
            case OrderStatus.Expired: {
              if (event.orderId === order.orderId) {
                this.orderResponse = null;
                clearTimeout(orderTimeot.id);
                binanceWebsocket.removeEventListener('message', handleWebsocketEvent);
              }
              break;
            }
          }
        }
      })();
    };

    binanceWebsocket.addEventListener('message', handleWebsocketEvent);

    return order;
  }

  async cancel(): Promise<void> {
    return await this.order.cancel();
  }

  private async handleCancelingOrder(): Promise<void> {
    if (this.orderResponse) {
      const { price } = this.orderPriceObserver;
      const stopLossPrice = calcValueByPercentage(
        Number(this.orderResponse.price),
        this.threshold[this.orderResponse.side].STOP_LOSS_LIMIT
      );

      if (this.orderResponse.side === Side.Buy) {
        if (price >= stopLossPrice) {
          await this.order.cancel();
        }
      } else {
        if (price <= stopLossPrice) {
          await this.order.cancel();
        }
      }
    }
  }
}
