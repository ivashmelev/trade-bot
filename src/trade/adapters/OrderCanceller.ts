import { Order, OrderType, Side, Threshold } from '../types';
import { calcValueByPercentage, setIntervalAsync } from '../utils';
import { IOrderPlacer } from '../interfaces';
import { PriceObserver } from '../observers';

export class OrderCanceller implements IOrderPlacer {
  private orderPlacer: IOrderPlacer;
  private priceObserver: PriceObserver;
  private threshold: Threshold;
  private timeout: { id: NodeJS.Timeout };

  constructor(orderPlacer: IOrderPlacer, priceObserver: PriceObserver, threshold: Threshold) {
    this.priceObserver = priceObserver;
    this.threshold = threshold;
    this.orderPlacer = orderPlacer;
  }

  async expose(side: Side, price: number, quantity: string, type: OrderType): Promise<Order> {
    const order = await this.orderPlacer.expose(side, price, quantity, type);

    this.timeout = await setIntervalAsync(async () => await this.handleCancelingOrder(order), 1000);

    return order;
  }

  async cancel(order: Order): Promise<void> {
    return await this.orderPlacer.cancel(order);
  }

  private async handleCancelingOrder(order: Order): Promise<void> {
    const stopLossPrice = calcValueByPercentage(Number(order.price), this.threshold[order.side].STOP_LOSS_LIMIT);

    if (this.priceObserver.price) {
      if (order.side === Side.Buy) {
        if (this.priceObserver.price >= stopLossPrice) {
          clearTimeout(this.timeout.id);
          await this.cancel(order);
        }
      } else {
        if (this.priceObserver.price <= stopLossPrice) {
          clearTimeout(this.timeout.id);
          await this.cancel(order);
        }
      }
    }
  }
}
