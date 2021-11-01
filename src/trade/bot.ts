import { Event, OrderStatus, Side, SymbolToken, Threshold } from './types';
import { OcoBuyer } from './ocoBuyer';
import { PriceWatcher } from './priceWatcher';
import { StopLossRepository } from './stopLossRepository';
import { StopLossRepositorySeller } from './stopLossRepositorySeller';
import { OrderSeller } from './orderSeller';
import { binanceWebsocket } from '../binance';
import { calcValueByPercentage, parseExecutionReportEvents } from './utils';
import chalk from 'chalk';
import moment from 'moment';
import { OrderCanceler } from './orderCanceler';

const deposit = 100;

const threshold: Threshold = {
  buy: {
    takeProfit: -0.2,
    stopLoss: 0.2,
  },
  sell: {
    takeProfit: 0.2,
    stopLoss: -0.2,
  },
  limit: 0.1,
};

const symbol: SymbolToken = SymbolToken.Btcusdt;
export class Bot {
  private orderSellerInterval: NodeJS.Timer;
  private stopLossRepositorySellerInterval: NodeJS.Timer;
  private priceWatcher: PriceWatcher;
  private ocoBuyer: OcoBuyer;
  private orderSeller: OrderSeller;
  private stopLossRepository: StopLossRepository;
  private stopLossRepositorySeller: StopLossRepositorySeller;
  private orderCanceler: OrderCanceler;

  constructor() {
    this.priceWatcher = new PriceWatcher(symbol);

    this.ocoBuyer = new OcoBuyer(
      symbol,
      deposit,
      threshold.buy.takeProfit,
      threshold.buy.stopLoss,
      threshold.limit,
      this.priceWatcher
    );

    this.orderSeller = new OrderSeller(symbol, deposit, threshold.sell.takeProfit, threshold.limit, this.priceWatcher);

    this.stopLossRepository = new StopLossRepository();

    this.stopLossRepositorySeller = new StopLossRepositorySeller(
      symbol,
      threshold.sell.takeProfit,
      threshold.limit,
      this.stopLossRepository,
      this.priceWatcher
    );

    this.orderCanceler = new OrderCanceler(symbol);
  }

  private handleCancellationSellOrder = (orderId: number, orderPrice: number) => (): void => {
    console.log(
      `cancellation hanler ${orderId} - ${this.priceWatcher.price} <= ${calcValueByPercentage(
        orderPrice,
        threshold.sell.stopLoss
      )}`
    );
    if (this.priceWatcher.price <= calcValueByPercentage(orderPrice, threshold.sell.stopLoss)) {
      void this.orderCanceler.cancel(orderId);
    }
  };

  start(): void {
    binanceWebsocket.addEventListener('open', () => {
      void (async () => {
        await this.priceWatcher.trackingPrice();
        await this.ocoBuyer.placeBuyOco();

        setInterval(async () => {
          if (
            this.priceWatcher.price >= this.stopLossRepositorySeller.averagePrice &&
            !this.stopLossRepositorySeller.isHaveActiveOrder
          ) {
            this.stopLossRepositorySeller.orderId = (await this.stopLossRepositorySeller.placeSellOrder()).orderId;
            this.stopLossRepositorySeller.isHaveActiveOrder = true;
            this.stopLossRepositorySellerInterval = setInterval(
              this.handleCancellationSellOrder(this.stopLossRepositorySeller.orderId, this.priceWatcher.price),
              10 * 1000
            );
          }
        }, 10 * 1000);
      })();
    });

    binanceWebsocket.addEventListener('message', (e: MessageEvent<string>) => {
      void (async (): Promise<void> => {
        const event = JSON.parse(e.data) as { e: Event };

        if (event.e === Event.ExecutionReport) {
          const payload = parseExecutionReportEvents(event);

          switch (payload.orderStatus) {
            case OrderStatus.New: {
              if (!payload.isOrderWorking) {
                console.log(
                  chalk.bgBlue(
                    `${moment().format('HH:mm:ss.SSS')} NEW ${payload.side} ${payload.orderType} ${payload.orderId}`
                  )
                );
                console.log(chalk.bgBlue(`order seller - ${this.orderSeller.orderId}`));
                console.log(chalk.bgBlue(`stop loss repository seller - ${this.stopLossRepositorySeller.orderId}`));
                console.log(payload);
              }
              break;
            }

            case OrderStatus.Filled: {
              console.log(
                chalk.bgGreen(
                  `${moment().format('HH:mm:ss.SSS')} FILLED ${payload.side} ${payload.orderType} ${payload.orderId}`
                )
              );
              console.log(payload);

              if (payload.orderId === this.orderSeller.orderId) {
                clearInterval(this.orderSellerInterval);
              }

              if (payload.orderId === this.stopLossRepositorySeller.orderId) {
                this.stopLossRepositorySeller.isHaveActiveOrder = false;
                clearInterval(this.stopLossRepositorySellerInterval);
                void this.stopLossRepository.clear();
              }

              if (payload.side === Side.Buy) {
                this.orderSeller.orderId = (await this.orderSeller.placeSellOrder()).orderId;
                this.orderSellerInterval = setInterval(
                  this.handleCancellationSellOrder(this.orderSeller.orderId, this.priceWatcher.price),
                  10 * 1000
                );
              } else if (payload.side === Side.Sell) {
                this.ocoBuyer.ocoId = (await this.ocoBuyer.placeBuyOco()).orderListId;
              }

              break;
            }

            case OrderStatus.Expired: {
              if (payload.orderId === this.orderSeller.orderId) {
                console.log(chalk.bgRed(`${moment().format('HH:mm:ss.SSS')} EXPIRED SELL ORDER ${payload.orderId}`));
                console.log(payload);

                clearInterval(this.orderSellerInterval);
                void this.stopLossRepository.save({
                  price: payload.price,
                  quantity: payload.quantity,
                });

                this.ocoBuyer.ocoId = (await this.ocoBuyer.placeBuyOco()).orderListId;
              }

              if (payload.orderId === this.stopLossRepositorySeller.orderId) {
                console.log(
                  chalk.bgRed(`${moment().format('HH:mm:ss.SSS')} EXPIRED SELL STOP LOSS REPOSITORY ${payload.orderId}`)
                );
                console.log(payload);
                this.stopLossRepositorySeller.isHaveActiveOrder = false;
              }

              break;
            }

            case OrderStatus.Canceled: {
              if (payload.orderId === this.orderSeller.orderId) {
                console.log(chalk.bgMagenta(`${moment().format('HH:mm:ss.SSS')} CANCEL SELL ORDER ${payload.orderId}`));
                console.log(payload);

                clearInterval(this.orderSellerInterval);
                void this.stopLossRepository.save({
                  price: payload.price,
                  quantity: payload.quantity,
                });
                this.ocoBuyer.ocoId = (await this.ocoBuyer.placeBuyOco()).orderListId;
              }

              if (payload.orderId === this.stopLossRepositorySeller.orderId) {
                console.log(
                  chalk.bgMagenta(
                    `${moment().format('HH:mm:ss.SSS')} CANCEL SELL STOP LOSS REPOSITORY ${payload.orderId}`
                  )
                );
                console.log(payload);

                this.stopLossRepositorySeller.isHaveActiveOrder = false;
                clearInterval(this.stopLossRepositorySellerInterval);
              }
            }
          }
        }
      })();
    });

    binanceWebsocket.addEventListener('error', (e) => {
      console.log(e);
    });
  }
}
