import { Order, OrderType, Side, Threshold } from '../types';
import interval, { stop } from 'interval-promise';
import { calcValueByPercentage } from '../utils';
import { IOrderPlacer } from '../interfaces';
import { PriceObserver } from '../observers';
import { OrderPlacer } from '../placers';

export class OrderCanceller implements IOrderPlacer {
  private orderPlacer: IOrderPlacer;
  private priceObserver: PriceObserver;
  private threshold: Threshold;

  constructor(orderPlacer: OrderPlacer, priceObserver: PriceObserver, threshold: Threshold) {
    this.priceObserver = priceObserver;
    this.threshold = threshold;
    this.orderPlacer = orderPlacer;
  }

  async expose(side: Side, price: number, quantity: string, type: OrderType): Promise<Order> {
    const order = await this.orderPlacer.expose(side, price, quantity, type);

    await interval(async (_, stop) => await this.handleCancelingOrder(order, stop), 1000);

    return order;
  }

  async cancel(order: Order): Promise<void> {
    return await this.orderPlacer.cancel(order);
  }

  private async handleCancelingOrder(order: Order, stop: stop): Promise<void> {
    const stopLossPrice = calcValueByPercentage(Number(order.price), this.threshold[order.side].STOP_LOSS_LIMIT);

    if (order.side === Side.Buy) {
      if (this.priceObserver.price >= stopLossPrice) {
        stop();
        await this.orderPlacer.cancel(order);
      }
    } else {
      if (this.priceObserver.price <= stopLossPrice) {
        stop();
        await this.orderPlacer.cancel(order);
      }
    }
  }
}
