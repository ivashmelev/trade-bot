import chalk from 'chalk';
import moment from 'moment';
import { binanceRestPrivate, binanceWebsocket } from '../binance';
import { Order } from './interfaces';
import {
  CommonOrderAdapterForStopLossRepositoryCleaner,
  CommonOrderAdapterForStopLossRepositorySaver,
  StopLossRepository,
} from './orderRepository';
import { CommonOrder, OcoOrder } from './orders';
import { CommonOrderAdapterForСancelingOrder, OrderPriceObserver, OrderPricePublisher } from './priceObserver';
import { Event, OrderStatus, OrderType, Side, SymbolToken, Threshold } from './types';
import { parseExecutionReportEvents } from './utils';

export class TradeFacade {
  private orderPricePublisher: OrderPricePublisher;
  private orderPriceObserver: OrderPriceObserver;
  private ocoOrder: OcoOrder;
  private sellOrder: Order;
  private stopLossOrder: Order;
  private stopLossRepository: StopLossRepository;
  private threshold: Threshold;
  private deposit: number;
  private symbol: SymbolToken;

  constructor(symbol: SymbolToken, threshold: Threshold, deposit: number) {
    this.orderPricePublisher = new OrderPricePublisher(symbol);
    this.orderPriceObserver = new OrderPriceObserver();
    this.stopLossRepository = new StopLossRepository();
    this.symbol = symbol;
    this.ocoOrder = new OcoOrder(symbol, threshold);

    this.sellOrder = new CommonOrderAdapterForСancelingOrder(
      new CommonOrderAdapterForStopLossRepositorySaver(new CommonOrder(symbol, threshold), this.stopLossRepository),
      this.orderPriceObserver,
      threshold
    );

    this.stopLossOrder = new CommonOrderAdapterForСancelingOrder(
      new CommonOrderAdapterForStopLossRepositoryCleaner(new CommonOrder(symbol, threshold), this.stopLossRepository),
      this.orderPriceObserver,
      threshold
    );

    this.threshold = threshold;
    this.deposit = deposit;

    this.orderPricePublisher.subscribe(this.orderPriceObserver);
  }

  async trade(): Promise<void> {
    await this.orderPricePublisher.startGetPrice();
    await this.stopLossRepository.getOrders();
    // await this.ocoOrder.expose(Side.Buy, this.orderPriceObserver.price, this.quantity);
    await this.sellOrder.expose(Side.Sell, this.orderPriceObserver.price, this.quantity, OrderType.TakeProfitLimit);

    // await setIntervalAsync(async () => {
    //   if (!this.stopLossOrder.orderResponse && this.orderPriceObserver.price >= this.stopLossRepository.averagePrice) {
    //     await this.stopLossOrder.expose(
    //       Side.Sell,
    //       this.orderPriceObserver.price,
    //       this.stopLossRepository.amountQuantity,
    //       OrderType.TakeProfitLimit
    //     );

    //     console.log(this.stopLossOrder.orderResponse);
    //   }
    // }, 1000);

    binanceWebsocket.addEventListener('message', (e) => {
      void (async () => {
        const event = parseExecutionReportEvents(e);

        if (event.eventType === Event.ExecutionReport) {
          switch (event.orderStatus) {
            case OrderStatus.New: {
              console.log(
                chalk.bgBlue(`${moment().format('HH:mm:ss.SSS')}: ${event.orderStatus} ${event.side} ${event.orderId}`)
              );
              break;
            }
            case OrderStatus.Filled: {
              await this.exposeBuyOrSell(event.side);

              console.log(
                chalk.bgGreen(`${moment().format('HH:mm:ss.SSS')}: ${event.orderStatus} ${event.side} ${event.orderId}`)
              );

              break;
            }
            // case OrderStatus.Expired:
            case OrderStatus.Canceled: {
              await this.exposeBuyOrSell(event.side);

              console.log(
                chalk.bgRed(`${moment().format('HH:mm:ss.SSS')}: ${event.orderStatus} ${event.side} ${event.orderId}`)
              );

              break;
            }
          }
        }
      })();
    });

    binanceWebsocket.addEventListener('error', (e) => {
      console.log(e);
    });
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

  private get quantity(): string {
    const quantityStr = String(this.deposit / this.orderPriceObserver.price);
    return quantityStr.slice(0, quantityStr.lastIndexOf('.') + 6);
  }

  private async exposeBuyOrSell(side: Side): Promise<void> {
    try {
      await this.sellOrder.expose(Side.Sell, this.orderPriceObserver.price, this.quantity, OrderType.TakeProfitLimit);
    } catch (error) {
      await this.sellOrder.expose(Side.Sell, this.orderPriceObserver.price, this.quantity, OrderType.TakeProfitLimit);
    }
  }
}
