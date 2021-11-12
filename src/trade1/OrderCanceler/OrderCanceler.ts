import chalk from 'chalk';
import moment from 'moment';
import { binanceRestPrivate } from '../../binance';
import { PriceWatcher } from '../PriceWatcher';
import { StopLossRepository } from '../StopLossRepository';
import { Order, Side, SymbolToken } from '../types';
import { setIntervalAsync } from '../utils';
import { CancellationRecord } from './types';

export class OrderCanceler {
  private symbol: SymbolToken;
  private records: CancellationRecord[];
  private priceWathcer: PriceWatcher;
  private stopLossRepository: StopLossRepository;

  constructor(symbol: SymbolToken, priceWathcer: PriceWatcher, stopLossRepository: StopLossRepository) {
    this.symbol = symbol;
    this.records = [];
    this.priceWathcer = priceWathcer;
    this.stopLossRepository = stopLossRepository;
  }

  cancelWhenPriceIsReached(order: Order, price: number): void {
    this.records.push({ order: order, price });
  }

  async cancel(id: number): Promise<void> {
    try {
      await binanceRestPrivate.delete('/order', {
        params: { symbol: this.symbol, orderId: id },
      });
    } catch (error) {
      return Promise.reject(new Error('Order canceler error from method cancel'));
    }
  }

  async startTrackingPriceToCancel(): Promise<void> {
    const isHaveCancellationOrder = (order: Order, price: number) => {
      if (order.side === Side.Buy) {
        return this.priceWathcer.price >= price;
      }

      return this.priceWathcer.price <= price;
    };

    await setIntervalAsync(async () => {
      try {
        this.records.forEach(({ order, price }, index) => {
          if (isHaveCancellationOrder(order, price)) {
            void this.cancel(order.orderId);

            if (order.side === Side.Sell) {
              void this.stopLossRepository.save({ price: order.price, quantity: order.origQty });
              console.log(chalk.bgRed(`${moment().format('HH:mm:ss.SSS')} CANCEL SELL ORDER ${order.orderId}`));
            }

            this.records.splice(index, 1);
          }
        });
      } catch (error) {
        return Promise.reject(new Error('Order canceler error from method startTrackingPriceToCancel'));
      }
    }, 1000);
  }
}
