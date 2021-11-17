import { OrderPriceObserver } from '..';
import { OrderDto, OrderStatus, OrderType, Side, Event, ExecutionReportEvent, Threshold } from '../../types';
import { Order } from '../../interfaces';
import { CommonOrder } from '../../orders';
import { binanceWebsocket } from '../../../binance';
import { calcValueByPercentage, defineWebsocketEvent, setIntervalAsync } from '../../utils';

export class CommonOrderAdapterForCancellationOrder implements Order {
  private commonOrder: CommonOrder;
  private orderPriceObserver: OrderPriceObserver;
  private threshold: Threshold;

  constructor(commonOrder: CommonOrder, orderPriceObserver: OrderPriceObserver, threshold: Threshold) {
    this.commonOrder = commonOrder;
    this.orderPriceObserver = orderPriceObserver;
    this.threshold = threshold;
  }

  async expose(side: Side, price: number, quantity: string, type: OrderType): Promise<OrderDto> {
    const order = await this.commonOrder.expose(side, price, quantity, type);
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
    return await this.commonOrder.cancel();
  }

  private async handleCancelingOrder(): Promise<void> {
    if (this.commonOrder.order) {
      const { price } = this.orderPriceObserver;
      const stopLossPrice = calcValueByPercentage(
        Number(this.commonOrder.order.price),
        this.threshold[this.commonOrder.order.side].STOP_LOSS_LIMIT
      );

      if (this.commonOrder.order.side === Side.Buy) {
        if (price >= stopLossPrice) {
          await this.commonOrder.cancel();
        }
      } else {
        if (price <= stopLossPrice) {
          await this.commonOrder.cancel();
        }
      }
    }
  }
}
