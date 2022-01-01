import { Order, OrderStatus, OrderType, Side, SymbolToken, Threshold } from './types';
import { OrderChecker, PriceObserver } from './observers';
import { StopLossRepository } from './repositories';
import { OcoPlacer, OrderPlacer } from './placers';
import { setIntervalAsync } from './utils';
import chalk from 'chalk';
import moment from 'moment';
import { OrderCanceller, StopLossOrderSaver } from './adapters';
import { IOrderPlacer } from './interfaces';
import { binanceRestPrivate } from '../binance';

export class Trade {
  private readonly symbol: SymbolToken;
  private threshold: Threshold;
  private readonly deposit: number;
  private readonly priceObserver: PriceObserver;
  private readonly stopLossRepository: StopLossRepository;
  private ocoPlacer: OcoPlacer;
  private activeOrder: Order | null;
  private sellOrderPlacer: IOrderPlacer;
  private side: Side;
  private orderChecker: OrderChecker;

  constructor(symbol: SymbolToken, threshold: Threshold, deposit: number) {
    this.symbol = symbol;
    this.threshold = threshold;
    this.deposit = deposit;
    this.priceObserver = new PriceObserver(symbol);
    this.stopLossRepository = new StopLossRepository();
    this.ocoPlacer = new OcoPlacer(symbol, threshold);
    this.activeOrder = null;
    this.sellOrderPlacer = new OrderCanceller(
      new StopLossOrderSaver(new OrderPlacer(symbol, threshold), this.stopLossRepository),
      this.priceObserver,
      threshold
    );
    this.side = Side.Buy;
    this.orderChecker = new OrderChecker(symbol);
  }

  async trade(): Promise<void> {
    await this.priceObserver.startGetPrice();
    await this.stopLossRepository.getStoredOrders();

    // if (this.priceObserver.price) {
    //   const oco = await this.ocoPlacer.expose(Side.Buy, this.priceObserver.price, this.quantity);
    //   this.activeOrder = oco.orders[0];
    //   //
    //   //   const order = await this.sellOrderPlacer.expose(
    //   //     Side.Sell,
    //   //     this.priceObserver.price,
    //   //     this.quantity,
    //   //     OrderType.TakeProfitLimit
    //   //   );
    //   //
    //   //   this.activeOrder = order;
    //   //
    //   //   this.side = Side.Sell;
    // }
    // //
    // await setIntervalAsync(async () => {
    //   if (this.activeOrder) {
    //     const order = await this.orderChecker.check(this.activeOrder);
    //     await this.pipeline(order);
    //   }
    // }, 1000);
  }

  private get quantity(): string {
    if (this.priceObserver.price) {
      const quantityStr = String(this.deposit / this.priceObserver.price);
      return quantityStr.slice(0, quantityStr.lastIndexOf('.') + 6);
    }

    return '0';
  }

  private async pipeline(order: Order) {
    if (this.activeOrder) {
      switch (order.status) {
        case OrderStatus.New: {
          console.log(
            chalk.bgBlue(`${moment().format('HH:mm:ss.SSS')}: ${order.status} ${order.side} ${order.orderId}`)
          );
          this.activeOrder = order;
          break;
        }
        case OrderStatus.Filled: {
          console.log(
            chalk.bgGreen(`${moment().format('HH:mm:ss.SSS')}: ${order.status} ${order.side} ${order.orderId}`)
          );
          this.activeOrder = null;
          await this.buyOrSell();
          break;
        }
        case OrderStatus.Canceled:
        case OrderStatus.Expired: {
          console.log(
            chalk.bgRed(`${moment().format('HH:mm:ss.SSS')}: ${order.status} ${order.side} ${order.orderId}`)
          );
          this.activeOrder = null;
          await this.buyOrSell();
          break;
        }
      }
    }
  }

  private async buyOrSell() {
    if (this.priceObserver.price) {
      //   if (this.side === Side.Buy) {
      const oco = await this.ocoPlacer.expose(Side.Buy, this.priceObserver.price, this.quantity);
      this.activeOrder = oco.orders[0];
      //   } else if (this.side === Side.Sell) {
      //     this.activeOrder = await this.sellOrderPlacer.expose(
      //       Side.Sell,
      //       this.priceObserver.price,
      //       this.quantity,
      //       OrderType.TakeProfitLimit
      //     );
      //   }

      // this.activeOrder = await this.sellOrderPlacer.expose(
      //   Side.Sell,
      //   this.priceObserver.price,
      //   this.quantity,
      //   OrderType.TakeProfitLimit
      // );

      this.side = this.side === Side.Buy ? Side.Sell : Side.Buy;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async cancelOrders(): Promise<any> {
    const response = await binanceRestPrivate.delete('/openOrders', {
      params: { symbol: this.symbol },
    });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return response.data;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getOpenOrders(): Promise<any> {
    const response = await binanceRestPrivate.get('/openOrders', { params: { symbol: this.symbol } });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return response.data;
  }
}
