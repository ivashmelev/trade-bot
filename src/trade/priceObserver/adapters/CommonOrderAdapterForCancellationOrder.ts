import { OrderPriceObserver } from '..';
import { OrderDto, OrderStatus, OrderType, Side, Event, Threshold } from '../../types';
import { Order } from '../../interfaces';
import { binanceWebsocket } from '../../../binance';
import { calcValueByPercentage, parseExecutionReportEvents, setIntervalAsync } from '../../utils';

export class CommonOrderAdapterForСancelingOrder implements Order {
  private order: Order;
  private orderPriceObserver: OrderPriceObserver;
  private threshold: Threshold;
  private orderTimeout: { id: NodeJS.Timeout };

  constructor(order: Order, orderPriceObserver: OrderPriceObserver, threshold: Threshold) {
    this.orderPriceObserver = orderPriceObserver;
    this.threshold = threshold;
    this.order = order;
  }

  async expose(side: Side, price: number, quantity: string, type: OrderType): Promise<OrderDto> {
    const order = await this.order.expose(side, price, quantity, type);

    const handleWebsocketEvent = (e: unknown) => {
      void (async () => {
        const event = parseExecutionReportEvents(e);

        if (event.eventType === Event.ExecutionReport) {
          switch (event.orderStatus) {
            case OrderStatus.New: {
              console.log(`event: ${event.orderId} order: ${order.orderId}`);
              if (event.orderId === order.orderId) {
                this.orderTimeout = await setIntervalAsync(async () => await this.handleCancelingOrder(order), 1000);
              }
              break;
            }
            case OrderStatus.Filled:
            case OrderStatus.Canceled:
            case OrderStatus.Expired: {
              if (event.orderId === order.orderId) {
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

  async cancel(order: OrderDto): Promise<void> {
    return await this.order.cancel(order);
  }

  private async handleCancelingOrder(order: OrderDto): Promise<void> {
    const { price } = this.orderPriceObserver;
    const stopLossPrice = calcValueByPercentage(Number(order.price), this.threshold[order.side].STOP_LOSS_LIMIT);

    if (order.side === Side.Buy) {
      if (price >= stopLossPrice) {
        clearTimeout(this.orderTimeout.id);
        await this.order.cancel(order);
      }
    } else {
      if (price <= stopLossPrice) {
        clearTimeout(this.orderTimeout.id);
        await this.order.cancel(order);
      }
    }
  }
}
