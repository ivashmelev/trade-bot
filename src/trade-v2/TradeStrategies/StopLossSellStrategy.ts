import { TradeStrategies } from './abstract';
import { CronJob } from 'cron';
import { ExecutionReportEvent, Order, Side } from '../../trade/types';
import { PriceObserver } from '../PriceObserver/PriceObserver';
import { StopLossOrderRepository } from '../OrderRepository/StopLossOrderRepository';
import { OrderService } from '../OrderService/types';
import chalk from 'chalk';
import moment from 'moment';
import { precision } from '../../utils/precision';

export class StopLossSellStrategy extends TradeStrategies {
  private job: CronJob | null;
  private priceObserver: PriceObserver;
  private stopLossOrderRepository: StopLossOrderRepository;
  private sellOrderService: OrderService;
  private activeOrderId: number | null;

  constructor(
    sellOrderService: OrderService,
    priceObserver: PriceObserver,
    stopLossOrderRepository: StopLossOrderRepository
  ) {
    super();
    this.priceObserver = priceObserver;
    this.stopLossOrderRepository = stopLossOrderRepository;
    this.sellOrderService = sellOrderService;
    this.activeOrderId = null;
    this.job = null;
  }

  launch() {
    super.launch();
    this.job = this.createJobOnCheckingStopLossPlacing();
  }

  protected new(payload: ExecutionReportEvent) {
    if (this.activeOrderId === payload.orderId) {
      console.log(
        chalk.bgBlue(
          `${moment().format('HH:mm:ss.SSS')} [SLT]: ${payload.orderStatus} ${payload.side} ${payload.orderId}`
        )
      );
    }
  }

  protected filled(payload: ExecutionReportEvent) {
    if (payload.orderId === this.activeOrderId) {
      super.stopListening();
      if (this.job) {
        this.job.start();
      }
      console.log(
        chalk.bgGreen(
          `${moment().format('HH:mm:ss.SSS')} [SLT]: ${payload.orderStatus} ${payload.side} ${payload.orderId}`
        )
      );
    }
  }

  protected canceled(payload: ExecutionReportEvent) {
    if (payload.orderId === this.activeOrderId) {
      this.stopListening();
      if (this.job) {
        this.job.start();
      }
      console.log(
        chalk.bgRed(
          `${moment().format('HH:mm:ss.SSS')} [SLT]: ${payload.orderStatus} ${payload.side} ${payload.orderId}`
        )
      );
    }
  }

  protected expired(payload: ExecutionReportEvent) {
    this.canceled(payload);
  }

  private createJobOnCheckingStopLossPlacing() {
    return new CronJob(
      '* * * * * *',
      async () => {
        if (this.priceObserver.price && this.priceObserver.price >= this.stopLossOrderRepository.averagePrice) {
          try {
            if (this.job) {
              this.job.start();
            }

            super.startListening();

            const order = (await this.sellOrderService.place(
              Side.Sell,
              precision(this.stopLossOrderRepository.averagePrice),
              precision(this.stopLossOrderRepository.amountQuantity)
            )) as Order;

            this.activeOrderId = order.orderId;
          } catch (e) {
            if (this.job) {
              this.job.start();
            }
          }
        }
      },
      null,
      true
    );
  }
}
