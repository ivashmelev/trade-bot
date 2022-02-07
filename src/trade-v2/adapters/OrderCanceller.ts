import { OrderService } from '../OrderService/types';
import { PriceObserver } from '../../trade/observers';
import { Oco, Order, Side, Threshold } from '../../trade/types';
import { CronJob } from 'cron';
import { calcValueByPercentage } from '../../trade/utils';

/**
 * Смотрит на цену и при необходимости отменяет ордер
 */
export class OrderCanceller implements OrderService {
  private orderService: OrderService;
  private priceObserver: PriceObserver;
  private threshold: Threshold;
  private activeOrder: Order | null;
  private job: CronJob;
  private stopLossPrice: number | null;

  constructor(orderService: OrderService, priceObserver: PriceObserver, threshold: Threshold) {
    this.priceObserver = priceObserver;
    this.threshold = threshold;
    this.orderService = orderService;
    this.activeOrder = null;
    this.stopLossPrice = null;
    this.job = this.createCancelingOrdersJob();
  }

  async place(side: Side, price: number, quantity: number): Promise<Order> {
    this.activeOrder = (await this.orderService.place(side, price, quantity)) as Order;
    this.stopLossPrice = calcValueByPercentage(price, this.threshold[this.activeOrder.side].STOP_LOSS_LIMIT);
    this.job.start();
    return this.activeOrder;
  }

  async cancel(order: Order | Oco): Promise<void> {
    this.job.stop();
    const result = await this.orderService.cancel(order);
    this.activeOrder = null;
    return result;
  }

  /**
   * Создает задачу которая, каждую секунду смотрит цену и при совпадении условия отменяет ордер
   */
  private createCancelingOrdersJob() {
    return new CronJob('* * * * * *', async () => {
      if (this.activeOrder && this.priceObserver.price && this.stopLossPrice) {
        if (this.activeOrder.side === Side.Buy) {
          if (this.priceObserver.price >= this.stopLossPrice) {
            await this.cancel(this.activeOrder);
          }
        } else {
          if (this.priceObserver.price <= this.stopLossPrice) {
            await this.cancel(this.activeOrder);
          }
        }
      }
    });
  }
}
