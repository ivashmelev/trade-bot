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

  private get price(): number {
    if (this.side === Side.Buy) {
      return calcValueByPercentage(this.marketPrice, this.threshold.buy.takeProfit);
    }

    if (this.side === Side.Sell) {
      return calcValueByPercentage(this.marketPrice, this.threshold.sell.takeProfit);
    }
  }

  private get stopPrice(): number {
    if (this.side === Side.Buy) {
      return calcValueByPercentage(this.marketPrice, this.threshold.buy.stopLoss);
    }

    if (this.side === Side.Sell) {
      return calcValueByPercentage(this.marketPrice, this.threshold.sell.stopLoss);
    }
  }

  private get stopLimitPrice(): number {
    if (this.side === Side.Buy) {
      return calcValueByPercentage(this.stopPrice, -this.limitThreshold);
    }

    if (this.side === Side.Sell) {
      return calcValueByPercentage(this.stopPrice, this.limitThreshold);
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

    try {
      const response = await binanceRestPrivate.post<{ orderListId: number }>('/order/oco', null, {
        params: {
          symbol: this.symbol,
          side: this.side,
          quantity: this.quantity,
          price: this.price.toFixed(2),
          stopPrice: this.stopPrice.toFixed(2),
          stopLimitPrice: this.stopLimitPrice.toFixed(2),
          stopLimitTimeInForce: TimeInForce.Gtc,
        } as OcoParams,
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
      this.createOco();
    });

    binanceWebsocket.addEventListener('error', (e) => {
      console.log(e);
    });
  }
}
