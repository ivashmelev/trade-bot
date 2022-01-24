import { ExecutionReportEvent, Order, OrderStatus, OrderType, Side, SymbolToken, Threshold } from './types';
import { PriceObserver } from './observers';
import { StopLossRepository } from './repositories';
import { OcoPlacer, OrderPlacer } from './placers';
import { defineWebsocketEvent } from './utils';
import chalk from 'chalk';
import moment from 'moment';
import { OrderCanceller, StopLossOrderCleaner, StopLossOrderSaver } from './adapters';
import { IOrderPlacer } from './interfaces';
import { binance } from '../binance';
import { CronJob } from 'cron';

export class Trade {
  private readonly symbol: SymbolToken;
  private threshold: Threshold;
  private readonly deposit: number;
  private readonly priceObserver: PriceObserver;
  private readonly stopLossRepository: StopLossRepository;
  private ocoPlacer: OcoPlacer;
  private sellOrderPlacer: IOrderPlacer;
  private sellStopLossOrderPlacer: IOrderPlacer;
  private side: Side;

  constructor(symbol: SymbolToken, threshold: Threshold, deposit: number) {
    this.symbol = symbol;
    this.threshold = threshold;
    this.deposit = deposit;
    this.priceObserver = new PriceObserver(symbol);
    this.stopLossRepository = new StopLossRepository();
    this.ocoPlacer = new OcoPlacer(symbol, threshold);

    this.sellOrderPlacer = new OrderCanceller(
      new StopLossOrderSaver(new OrderPlacer(symbol, threshold), this.stopLossRepository),
      this.priceObserver,
      threshold
    );

    this.sellStopLossOrderPlacer = new OrderCanceller(
      new StopLossOrderCleaner(new OrderPlacer(symbol, threshold), this.stopLossRepository),
      this.priceObserver,
      threshold
    );

    this.side = Side.Buy;
  }

  async trade(): Promise<void> {
    await this.initialization();
    await this.mainThread();
    await this.stopLossThread();
  }

  private async initialization() {
    binance.initRest();
    await binance.initWebsocket();
    await this.priceObserver.startGetPrice();
    await this.stopLossRepository.getStoredOrders();
  }

  private async mainThread() {
    let orderId: Order['orderId'] | null = null;

    const buyOrSell = async () => {
      if (this.priceObserver.price) {
        const getQuantity = (price: number) => {
          const quantityStr = String(this.deposit / price);
          return quantityStr.slice(0, quantityStr.lastIndexOf('.') + 6);
        };

        const quantity = getQuantity(this.priceObserver.price);

        if (this.side === Side.Buy) {
          await this.ocoPlacer.place(Side.Buy, this.priceObserver.price, quantity);
        } else if (this.side === Side.Sell) {
          await this.sellOrderPlacer.place(Side.Sell, this.priceObserver.price, quantity, OrderType.TakeProfitLimit);
        }

        this.side = this.side === Side.Buy ? Side.Sell : Side.Buy;
      }
    };

    const orderStatusListener = (event: MessageEvent) => {
      void (async () => {
        const payload = defineWebsocketEvent(JSON.parse(event.data)) as ExecutionReportEvent;

        switch (payload.orderStatus) {
          case OrderStatus.New: {
            if (orderId === null) {
              orderId = payload.orderId;
              console.log(
                chalk.bgBlue(
                  `${moment().format('HH:mm:ss.SSS')} [MT]: ${payload.orderStatus} ${payload.side} ${payload.orderId}`
                )
              );
            }
            break;
          }
          case OrderStatus.Filled: {
            if (orderId === payload.orderId) {
              console.log(
                chalk.bgGreen(
                  `${moment().format('HH:mm:ss.SSS')} [MT]: ${payload.orderStatus} ${payload.side} ${payload.orderId}`
                )
              );
              orderId = null;
              await buyOrSell();
            }
            break;
          }
          case OrderStatus.Canceled:
          case OrderStatus.Expired: {
            if (orderId === payload.orderId) {
              console.log(
                chalk.bgRed(
                  `${moment().format('HH:mm:ss.SSS')} [MT]: ${payload.orderStatus} ${payload.side} ${payload.orderId}`
                )
              );
              orderId = null;
              await buyOrSell();
            }
            break;
          }
        }
      })();
    };

    binance.websocket.addEventListener('message', orderStatusListener);

    await buyOrSell();
  }

  private stopLossThread(): Promise<void> {
    return new Promise((resolve) => {
      let orderId: Order['orderId'] | null = null;

      const job = new CronJob(
        '* * * * * *',
        async () => {
          if (this.priceObserver.price && this.priceObserver.price >= this.stopLossRepository.averagePrice) {
            try {
              job.stop();

              binance.websocket.addEventListener('message', orderStatusListener);

              await this.sellStopLossOrderPlacer.place(
                Side.Sell,
                this.stopLossRepository.averagePrice,
                this.stopLossRepository.amountQuantity,
                OrderType.TakeProfitLimit
              );
            } catch (e) {
              job.start();
            }
          }
        },
        null,
        true
      );

      const orderStatusListener = (event: MessageEvent) => {
        const payload = defineWebsocketEvent(JSON.parse(event.data)) as ExecutionReportEvent;

        switch (payload.orderStatus) {
          case OrderStatus.New: {
            if (orderId === null) {
              orderId = payload.orderId;
              console.log(
                chalk.bgBlue(
                  `${moment().format('HH:mm:ss.SSS')} [SLT]: ${payload.orderStatus} ${payload.side} ${payload.orderId}`
                )
              );
            }
            break;
          }
          case OrderStatus.Filled: {
            if (payload.orderId === orderId) {
              binance.websocket.removeEventListener('message', orderStatusListener);
              job.start();
              console.log(
                chalk.bgGreen(
                  `${moment().format('HH:mm:ss.SSS')} [SLT]: ${payload.orderStatus} ${payload.side} ${payload.orderId}`
                )
              );
            }
            break;
          }
          case OrderStatus.Canceled:
          case OrderStatus.Expired: {
            if (payload.orderId === orderId) {
              binance.websocket.removeEventListener('message', orderStatusListener);
              job.start();
              console.log(
                chalk.bgRed(
                  `${moment().format('HH:mm:ss.SSS')} [SLT]: ${payload.orderStatus} ${payload.side} ${payload.orderId}`
                )
              );
            }
            break;
          }
        }
      };

      resolve();
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async cancelOrders(): Promise<any> {
    const response = await binance.restPrivate.delete('/openOrders', {
      params: { symbol: this.symbol },
    });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return response.data;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getOpenOrders(): Promise<any> {
    const response = await binance.restPrivate.get('/openOrders', { params: { symbol: this.symbol } });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return response.data;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getExchangeInfo(): Promise<any> {
    const response = await binance.restPublic.get('/exchangeInfo', { params: { symbol: this.symbol } });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return response.data;
  }
}
