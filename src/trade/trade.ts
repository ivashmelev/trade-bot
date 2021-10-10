import axios, { AxiosError } from 'axios';
import chalk from 'chalk';
import moment from 'moment';
import { binanceRestPrivate, binanceRestPublic, binanceWebsocket } from '../binance';
import {
  AccountInfo,
  CancelOcoParams,
  CoincapRate,
  Event,
  OcoParams,
  OrderResponse,
  OrderStatus,
  OrderType,
  Payload,
  Side,
  Symbol,
  Threshold,
  TimeInForce,
} from './types';
import { calcValueByPercentage } from './utils';

/**
 * TODO
 * 1. Сохранять ids ордеров
 * 2. Реализовать функционал стоп лосса
 * 3. Обновить вебсокет согласно новой стратегии
 *
 * BUGS
 * 1. The relationship of the prices for the orders is not correct.
 * 2. Обнуляются ордера без какой либо причины (TimeInForce.Gtc)
 */

export class Trade {
  private threshold: Threshold;
  private limitThreshold: number;
  private side: Side;
  private deposit: number;
  private marketPrice: number | null;
  private activeOcoId: number | null;
  private symbol: Symbol;

  constructor(symbol: Symbol) {
    this.threshold = {
      buy: {
        takeProfit: -0.2,
        stopLoss: 0.2,
      },
      sell: {
        takeProfit: 0.2,
        stopLoss: -0.2,
      },
    };
    this.limitThreshold = 0.05;
    this.side = Side.Buy;
    this.deposit = 100;
    this.marketPrice = null;
    this.activeOcoId = null;
    this.symbol = symbol;
  }

  async getAccountInfo(assets?: string[]): Promise<AccountInfo> {
    try {
      const response = await binanceRestPrivate.get<AccountInfo>('/account');
      const result = response.data;

      if (assets) {
        result.balances = result.balances.filter((balance) => assets.includes(balance.asset));
      }

      return result;
    } catch (error) {
      throw error;
    }
  }

  private getPrice(side: Side, marketPrice: number, orderType: OrderType): number {
    if (orderType === OrderType.TakeProfitLimit) {
      if (side === Side.Buy) {
        return calcValueByPercentage(this.marketPrice, this.threshold.buy.takeProfit);
      }

      if (side === Side.Sell) {
        return calcValueByPercentage(this.marketPrice, this.threshold.sell.takeProfit);
      }
    } else if (orderType === OrderType.StopLossLimit) {
      if (side === Side.Buy) {
        return calcValueByPercentage(marketPrice, this.threshold.buy.stopLoss);
      }

      if (side === Side.Sell) {
        return calcValueByPercentage(marketPrice, this.threshold.sell.stopLoss);
      }
    }
  }

  private getLimitPrice(side: Side, price: number, limitThreshold: number): number {
    if (side === Side.Buy) {
      return calcValueByPercentage(price, -limitThreshold);
    }

    if (side === Side.Sell) {
      return calcValueByPercentage(price, limitThreshold);
    }
  }

  private get quantity(): string {
    const quantityStr: string = String(this.deposit / this.marketPrice);
    return quantityStr.slice(0, quantityStr.lastIndexOf('.') + 6);
  }

  async getMarketPrice(): Promise<number> {
    try {
      const response = await binanceRestPublic.get<{
        symbol: Symbol;
        price: string;
      }>('/ticker/price', { params: { symbol: this.symbol } });

      return Number(response.data.price);
    } catch (error) {
      console.log(
        error.config.url,
        error.config.method,
        error.response.statusText,
        JSON.stringify(error.response.data)
      );
    }
  }

  async createOco(): Promise<{ orderListId: number }> {
    if (this.marketPrice === null) {
      this.marketPrice = await this.getMarketPrice();
    }

    const stopPrice = this.getPrice(this.side, this.marketPrice, OrderType.StopLossLimit);

    try {
      const response = await binanceRestPrivate.post<{ orderListId: number }>('/order/oco', null, {
        params: {
          symbol: this.symbol,
          side: this.side,
          quantity: this.quantity,
          price: this.getPrice(this.side, this.marketPrice, OrderType.TakeProfitLimit).toFixed(2),
          stopPrice: stopPrice.toFixed(2),
          stopLimitPrice: this.getLimitPrice(this.side, stopPrice, this.limitThreshold).toFixed(2),
          stopLimitTimeInForce: TimeInForce.Gtc,
        } as OcoParams,
      });

      console.log(response.data);

      return response.data;
    } catch (error) {}
  }

  async createOrder() {
    if (this.marketPrice === null) {
      this.marketPrice = await this.getMarketPrice();
    }

    try {
      const response = await binanceRestPrivate.post('/order', null, {
        params: {
          symbol: this.symbol,
          side: this.side,
          quantity: this.quantity,
          price:
          stopPrice: this.getPrice(this.side, this.marketPrice, OrderType.StopLossLimit).toFixed(2)
          newOrderRespType: OrderResponse.Result,
        },
      });

      console.log(response.data);

      return response.data;
    } catch (error) {}
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

  listenOrderStream() {
    binanceWebsocket.addEventListener('message', (e: MessageEvent<string>) => {
      const payload = JSON.parse(e.data) as Payload;
      console.log(payload);
      if (payload.e === Event.ExecutionReport) {
        switch (payload.X) {
          case OrderStatus.New: {
            console.log(chalk.bgBlue(`${moment().format('HH:mm:ss.SSS')} NEW ${this.side} ${payload.o}`));
            break;
          }

          case OrderStatus.Filled: {
            const log = `${moment().format('HH:mm:ss.SSS')} [${this.side}]: ${payload.o}`;

            if (payload.o === OrderType.LimitMaker) {
              console.log(chalk.bgGreen(log));
            } else if (payload.o === OrderType.StopLossLimit) {
              console.log(chalk.bgRed(log));
            }

            if (this.side === Side.Sell) {
              this.deposit = Number(payload.Z);
            }

            this.side = this.side === Side.Buy ? Side.Sell : Side.Buy;
            this.marketPrice = null;

            this.createOco();

            break;
          }
        }
      }
      console.log(`deposit - ${this.deposit}`);
    });
  }

  trading() {
    this.listenOrderStream();

    binanceWebsocket.addEventListener('open', () => {
      // this.createOco();
    });

    binanceWebsocket.addEventListener('error', (e) => {
      console.log(e);
    });
  }
}
