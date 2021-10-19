import { Event, OrderStatus, OrderType, Side, Symbol } from '../types';
import { OcoBuyer } from './ocoBuyer';
import { PriceWatcher } from './priceWatcher';
import { StopLossRepository } from './stopLossRepository';
import { StopLossRepositorySeller } from './stopLossRepositorySeller';
import { OrderSeller } from './orderSeller';
import { binanceWebsocket } from '../../binance';
import { parseExecutionReportEvents } from '../utils';
import chalk from 'chalk';
import moment from 'moment';

const deposit = 100;

const threshold = {
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

const symbol = Symbol.Btcusdt;

const priceWatcher = new PriceWatcher(symbol);

const ocoBuyer = new OcoBuyer(
  symbol,
  deposit,
  threshold.buy.takeProfit,
  threshold.buy.stopLoss,
  threshold.limit,
  priceWatcher
);

const takeProfitOrderSeller = new OrderSeller(
  symbol,
  deposit,
  threshold.sell.takeProfit,
  threshold.limit,
  priceWatcher
);

const stopLossRepository = new StopLossRepository();

const stopLossRepositorySeller = new StopLossRepositorySeller(
  symbol,
  threshold.sell.takeProfit,
  threshold.limit,
  stopLossRepository,
  priceWatcher
);

export const Bot = {
  start: () => {
    binanceWebsocket.addEventListener('open', () => {
      ocoBuyer.placeBuyOco();
      stopLossRepositorySeller.trackingWhenCanPlaceOrder();
    });

    binanceWebsocket.addEventListener('message', (e: MessageEvent<string>) => {
      (async () => {
        const event = JSON.parse(e.data) as { e: Event };

        if (event.e === Event.ExecutionReport) {
          const payload = parseExecutionReportEvents(event);

          switch (payload.orderStatus) {
            case OrderStatus.New: {
              console.log(chalk.bgBlue(`${moment().format('HH:mm:ss.SSS')} NEW ${payload.side} ${payload.orderType}`));

              break;
            }

            case OrderStatus.Filled: {
              console.log(payload);
              const log = `${moment().format('HH:mm:ss.SSS')} [${payload.side}]: ${payload.orderType}`;

              if (payload.orderType === OrderType.LimitMaker || OrderType.TakeProfitLimit) {
                console.log(chalk.bgGreen(log));
              } else if (payload.orderType === OrderType.StopLossLimit) {
                console.log(chalk.bgRed(log));
              }

              if (payload.side === Side.Buy) {
                takeProfitOrderSeller.orderId = (await takeProfitOrderSeller.placeSellOrder()).orderId;
              } else if (payload.side === Side.Sell) {
                ocoBuyer.ocoId = (await ocoBuyer.placeBuyOco()).orderListId;
              }

              if (payload.orderId === stopLossRepositorySeller.orderId) {
                console.log(chalk.bgGreen(`${moment().format('HH:mm:ss.SSS')} FILLED SELL STOP LOSS REPOSITORY`));

                stopLossRepository.clear();
              }

              break;
            }

            case OrderStatus.Expired: {
              console.log(payload);
              if (payload.orderId === takeProfitOrderSeller.orderId) {
                console.log(chalk.bgBlue(`${moment().format('HH:mm:ss.SSS')} EXPIRED SELL ORDER`));

                stopLossRepository.save({
                  price: payload.price,
                  quantity: payload.quantity,
                });

                ocoBuyer.ocoId = (await ocoBuyer.placeBuyOco()).orderListId;
              }

              if (payload.orderId === stopLossRepositorySeller.orderId) {
                console.log(chalk.bgBlue(`${moment().format('HH:mm:ss.SSS')} EXPIRED SELL STOP LOSS REPOSITORY`));
              }

              break;
            }
          }
        }
      })();
    });

    binanceWebsocket.addEventListener('error', (e) => {
      console.log(e);
    });
  },
};