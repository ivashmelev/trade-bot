import axios, { AxiosError } from 'axios';
import chalk from 'chalk';
import moment from 'moment';
import { binanceRestPrivate, binanceRestPublic, binanceWebsocket } from '../binance';
import prisma from '../database';
import { StopLossManager } from './stopLossManager';
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
import { calcValueByPercentage, parseExecutionReportEvents } from './utils';

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
  private stopLossManager: StopLossManager;

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
    this.stopLossManager = new StopLossManager(this.threshold, this.limitThreshold, symbol);
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
    return calcValueByPercentage(this.marketPrice, this.threshold[this.side.toLowerCase()].takeProfit);
  }

  private get stopPrice(): number {
    return calcValueByPercentage(this.marketPrice, this.threshold[this.side.toLowerCase()].stopLoss);
  }

  private get stopLimitPrice(): number {
    const percentageStopLoss = this.threshold[this.side.toLowerCase()].stopLoss;
    const absPercentageWithLimit = Math.abs(percentageStopLoss) + this.limitThreshold;
    const percentageWithLimit = Math.sign(percentageStopLoss) === 1 ? absPercentageWithLimit : -absPercentageWithLimit;

    return calcValueByPercentage(this.marketPrice, percentageWithLimit);
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
    console.log('marketPrice', this.marketPrice.toFixed(2));
    console.log('price', this.price.toFixed(2));
    console.log('stopPrice', this.stopPrice.toFixed(2));
    console.log('stopLimitPrice', this.stopLimitPrice.toFixed(2));

    try {
      const response = await binanceRestPrivate.post<{ orderListId: number }>('/order/oco', null, {
        params: {
          symbol: this.symbol,
          side: this.side,
          quantity: this.quantity,
          price: this.price.toFixed(2), // Limit Price
          stopPrice: this.stopPrice.toFixed(2), // Last Price
          stopLimitPrice: this.stopLimitPrice.toFixed(2), // Stop Price
          stopLimitTimeInForce: TimeInForce.Gtc,
        } as OcoParams,
      });

      return response.data;
    } catch (error) {
      this.marketPrice = null;
      this.createOco();
    }
  }

  private async sellTakeProfit(): Promise<{ orderId: number }> {}

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
      (async () => {
        const event = JSON.parse(e.data) as { e: Event };

        if (event.e === Event.ExecutionReport) {
          const payload = parseExecutionReportEvents(event);
          let takeProfitSellId: number | null = null;

          switch (payload.orderStatus) {
            case OrderStatus.New: {
              console.log(chalk.bgBlue(`${moment().format('HH:mm:ss.SSS')} NEW ${this.side} ${payload.orderType}`));

              if (this.marketPrice >= this.stopLossManager.averagePrice) {
                this.stopLossManager.sellAll();
              }
              break;
            }

            case OrderStatus.Filled: {
              const log = `${moment().format('HH:mm:ss.SSS')} [${this.side}]: ${payload.orderType}`;

              if (payload.orderType === OrderType.LimitMaker) {
                console.log(chalk.bgGreen(log));
              } else if (payload.orderType === OrderType.StopLossLimit) {
                console.log(chalk.bgRed(log));
              }

              if (payload.orderId === this.stopLossManager.orderId) {
                this.stopLossManager.clear();
              }

              if (this.side === Side.Sell) {
                this.deposit = Number(payload.totalQuoteTradeQuantity);
              }

              this.side = this.side === Side.Buy ? Side.Sell : Side.Buy;
              this.marketPrice = null;

              await prisma.order.create({
                data: {
                  price: payload.price,
                  quantity: payload.quantity,
                  quoteQuantity: payload.totalQuoteTradeQuantity,
                  side: payload.side,
                  stopPrice: payload.stopPrice,
                  symbol: payload.symbol,
                  time: moment(payload.eventTime).toISOString(),
                  type: payload.orderType,
                },
              });

              if (this.side === Side.Sell) {
                takeProfitSellId = (await this.sellTakeProfit()).orderId;
              } else {
                const order = await this.createOco();
                console.log(order);
              }

              break;
            }

            case OrderStatus.Expired: {
              if (payload.orderId === takeProfitSellId) {
                this.stopLossManager.save(this.quantity, this.price);
              }
            }
          }
        }
      })();
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
