import chalk from 'chalk';
import moment from 'moment';
import { binanceRestPrivate, binanceWebsocket } from '../binance';
import { OrderPlacer } from './orderPlacer';
import { PriceObserver } from './priceObserver';
import { StopLossSaver } from './stopLossSaver';
import { CancelOcoParams, Event, OrderStatus, OrderType, Side, Symbol, Threshold } from './types';
import { parseExecutionReportEvents } from './utils';

const priceObserver = new PriceObserver(Symbol.Btcusdt);

interface ITradeFacade {
  trading: () => Promise<void>;
}

export class TradeFacade implements ITradeFacade {
  private threshold: Threshold;
  private side: Side;
  private orderPlacer: OrderPlacer;
  private stopLossSaver: StopLossSaver;
  private symbol: Symbol;

  constructor() {
    const deposit = 100;

    this.threshold = {
      buy: {
        takeProfit: -0.2,
        stopLoss: 0.2,
      },
      sell: {
        takeProfit: 0.2,
        stopLoss: -0.2,
      },
      limit: 0.05,
    };

    this.side = Side.Buy;
    this.symbol = Symbol.Btcusdt;
    this.orderPlacer = new OrderPlacer(Symbol.Btcusdt, this.threshold, deposit, priceObserver);
    this.stopLossSaver = new StopLossSaver();
  }

  async cancelOrder(id: number) {
    try {
      const response = await binanceRestPrivate.delete('/order', {
        params: { symbol: this.symbol, orderId: id },
      });

      return response.data;
    } catch (error) {}
  }

  async cancelOrders(id?: number) {
    try {
      const response = await binanceRestPrivate.delete('/openOrders', {
        params: { symbol: this.symbol } as CancelOcoParams,
      });
      return response.data;
    } catch (error) {}
  }

  async getOpenOrders() {
    try {
      const response = await binanceRestPrivate.get('/openOrders', { params: { symbol: this.symbol } });
      return response.data;
    } catch (error) {}
  }

  private listenOrderStream() {
    binanceWebsocket.addEventListener('message', (e: MessageEvent<string>) => {
      (async () => {
        const event = JSON.parse(e.data) as { e: Event };

        if (event.e === Event.ExecutionReport) {
          const payload = parseExecutionReportEvents(event);

          switch (payload.orderStatus) {
            case OrderStatus.New: {
              console.log(chalk.bgBlue(`${moment().format('HH:mm:ss.SSS')} NEW ${this.side} ${payload.orderType}`));

              break;
            }

            case OrderStatus.Filled: {
              const log = `${moment().format('HH:mm:ss.SSS')} [${this.side}]: ${payload.orderType}`;

              if (payload.orderType === OrderType.LimitMaker) {
                console.log(chalk.bgGreen(log));
              } else if (payload.orderType === OrderType.StopLossLimit) {
                console.log(chalk.bgRed(log));
              }

              this.side = this.side === Side.Buy ? Side.Sell : Side.Buy;

              // Выставление OCO ордеров, основной поток
              if (this.side === Side.Buy) {
                this.orderPlacer.placeBuyOco();
              } else {
                this.orderPlacer.placeSellOrder();
              }

              // Ордер продажи стоплоссов
              // if(payload.orderId )

              break;
            }

            case OrderStatus.Expired: {
              // Действия если не удалось продать с takeProfit
              if (payload.orderId === this.orderPlacer.sellOrderId) {
                console.log(chalk.bgBlue(`${moment().format('HH:mm:ss.SSS')} EXPIRED SELL ORDER`));

                this.stopLossSaver.save({ price: payload.price, quantity: payload.quantity });
                this.side = Side.Buy;

                this.orderPlacer.placeBuyOco();
              }

              break;
            }
          }

          console.log(payload);
        }
      })();
    });
  }

  async trading() {
    this.listenOrderStream();

    binanceWebsocket.addEventListener('open', () => {
      this.orderPlacer.placeBuyOco();
    });

    binanceWebsocket.addEventListener('error', (e) => {
      console.log(e);
    });
  }
}
