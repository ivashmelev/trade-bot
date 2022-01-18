import { Order, OrderType, Side, Threshold } from '../types';
import { calcValueByPercentage } from '../utils';
import { IOrderPlacer } from '../interfaces';
import { PriceObserver } from '../observers';
import { CronJob } from 'cron';

export class OrderCanceller implements IOrderPlacer {
  private orderPlacer: IOrderPlacer;
  private priceObserver: PriceObserver;
  private threshold: Threshold;
  private activeOrder: Order | null;
  private job: CronJob;
  private stopLossPrice: number | null;

  constructor(orderPlacer: IOrderPlacer, priceObserver: PriceObserver, threshold: Threshold) {
    this.priceObserver = priceObserver;
    this.threshold = threshold;
    this.orderPlacer = orderPlacer;
    this.activeOrder = null;
    this.stopLossPrice = null;
    this.job = this.createCancelingJob();
  }

  async place(side: Side, price: number, quantity: string, type: OrderType): Promise<Order> {
    this.activeOrder = await this.orderPlacer.place(side, price, quantity, type);
    this.stopLossPrice = calcValueByPercentage(price, this.threshold[this.activeOrder.side].STOP_LOSS_LIMIT);
    this.job.start();
    return this.activeOrder;
  }

  async cancel(order: Order): Promise<void> {
    try {
      this.job.stop();
      const result = await this.orderPlacer.cancel(order);
      this.activeOrder = null;
      return result;
    } catch {
      this.job.start();
    }
  }

  private createCancelingJob() {
    return new CronJob('* * * * * *', async () => {
      if (this.activeOrder && this.priceObserver.price && this.stopLossPrice) {
        if (this.activeOrder.side === Side.Buy) {
          if (this.priceObserver.price >= this.stopLossPrice) {
            await this.cancel(this.activeOrder);
          }
        } else {
          if (this.priceObserver.price <= this.stopLossPrice) {
            console.log(
              `currentPrice: ${this.priceObserver.price}, activeOrder: ${this.activeOrder.price}, stopLossPrice: ${this.stopLossPrice}`
            );
            await this.cancel(this.activeOrder);
          }
        }
      }
    });
  }
}
