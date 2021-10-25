import { Event, OrderStatus, OrderType, Side, Symbol } from '../types';
import { OcoBuyer } from './ocoBuyer';
import { PriceWatcher } from './priceWatcher';
import { StopLossRepository } from './stopLossRepository';
import { StopLossRepositorySeller } from './stopLossRepositorySeller';
import { OrderSeller } from './orderSeller';
import { binanceWebsocket } from '../../binance';
import { calcValueByPercentage, parseExecutionReportEvents } from '../utils';
import chalk from 'chalk';
import moment from 'moment';
import { OrderCanceler } from './orderCanceler';

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

const orderSeller = new OrderSeller(symbol, deposit, threshold.sell.takeProfit, threshold.limit, priceWatcher);

const stopLossRepository = new StopLossRepository();

const stopLossRepositorySeller = new StopLossRepositorySeller(
  symbol,
  threshold.sell.takeProfit,
  threshold.limit,
  stopLossRepository,
  priceWatcher
);

const orderCanceler = new OrderCanceler(symbol);

let orderSellerTimeout;
let stopLossRepositorySellerTimeout;

const handleCancellationSellOrder = (orderId: number, orderPrice: number) => () => {
  console.log(
    `cancellation hanler - ${priceWatcher.price} <= ${calcValueByPercentage(orderPrice, threshold.sell.stopLoss)}`
  );
  if (priceWatcher.price <= calcValueByPercentage(orderPrice, threshold.sell.stopLoss)) {
    orderCanceler.cancel(orderId);
  }
};

export const Bot = {
  start: () => {
    binanceWebsocket.addEventListener('open', () => {
      // (async () => {
      priceWatcher.trackingPrice();
      ocoBuyer.placeBuyOco();
      // orderSeller.orderId = (await orderSeller.placeSellOrder()).orderId;
      // stopLossRepositorySeller.trackingWhenCanPlaceOrder();
      // })();
    });

    binanceWebsocket.addEventListener('message', (e: MessageEvent<string>) => {
      (async () => {
        const event = JSON.parse(e.data) as { e: Event };

        if (event.e === Event.ExecutionReport) {
          const payload = parseExecutionReportEvents(event);

          switch (payload.orderStatus) {
            case OrderStatus.New: {
              console.log(
                chalk.bgBlue(
                  `${moment().format('HH:mm:ss.SSS')} NEW ${payload.side} ${payload.orderType} ${payload.orderId}`
                )
              );
              console.log(chalk.bgBlue(`order seller - ${orderSeller.orderId}`));
              console.log(chalk.bgBlue(`stop loss repository seller - ${stopLossRepositorySeller.orderId}`));
              console.log(payload);

              if (payload.orderId === orderSeller.orderId) {
                orderSellerTimeout = setTimeout(
                  handleCancellationSellOrder(payload.orderId, priceWatcher.price),
                  10 * 1000
                );
              }

              if (payload.orderId === stopLossRepositorySeller.orderId) {
                stopLossRepositorySeller.isHaveActiveOrder = true;

                stopLossRepositorySellerTimeout = setTimeout(
                  handleCancellationSellOrder(payload.orderId, priceWatcher.price),
                  10 * 1000
                );
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

              if (payload.side === Side.Buy) {
                orderSeller.placeSellOrder().then((value) => (orderSeller.orderId = value.orderId));
                // orderSeller.orderId = (await orderSeller.placeSellOrder()).orderId;
              } else if (payload.side === Side.Sell) {
                ocoBuyer.ocoId = (await ocoBuyer.placeBuyOco()).orderListId;
              }

              if (payload.orderId === orderSeller.orderId) {
                clearInterval(orderSellerTimeout);
              }

              if (payload.orderId === stopLossRepositorySeller.orderId) {
                stopLossRepositorySeller.isHaveActiveOrder = false;
                clearInterval(stopLossRepositorySellerTimeout);
                stopLossRepository.clear();
              }

              break;
            }

            case OrderStatus.Expired: {
              if (payload.orderId === orderSeller.orderId) {
                console.log(chalk.bgRed(`${moment().format('HH:mm:ss.SSS')} EXPIRED SELL ORDER ${payload.orderId}`));
                console.log(payload);

                clearInterval(orderSellerTimeout);
                stopLossRepository.save({
                  price: payload.price,
                  quantity: payload.quantity,
                });

                ocoBuyer.ocoId = (await ocoBuyer.placeBuyOco()).orderListId;
              }

              if (payload.orderId === stopLossRepositorySeller.orderId) {
                console.log(
                  chalk.bgRed(`${moment().format('HH:mm:ss.SSS')} EXPIRED SELL STOP LOSS REPOSITORY ${payload.orderId}`)
                );
                console.log(payload);
                stopLossRepositorySeller.isHaveActiveOrder = false;
              }

              break;
            }

            case OrderStatus.Canceled: {
              if (payload.orderId === orderSeller.orderId) {
                console.log(chalk.bgMagenta(`${moment().format('HH:mm:ss.SSS')} CANCEL SELL ORDER ${payload.orderId}`));
                console.log(payload);

                clearInterval(orderSellerTimeout);
                stopLossRepository.save({
                  price: payload.price,
                  quantity: payload.quantity,
                });
                ocoBuyer.ocoId = (await ocoBuyer.placeBuyOco()).orderListId;
              }

              if (payload.orderId === stopLossRepositorySeller.orderId) {
                console.log(
                  chalk.bgMagenta(
                    `${moment().format('HH:mm:ss.SSS')} CANCEL SELL STOP LOSS REPOSITORY ${payload.orderId}`
                  )
                );
                console.log(payload);

                stopLossRepositorySeller.isHaveActiveOrder = false;
                clearInterval(stopLossRepositorySellerTimeout);
              }
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
