import { AssetBalance, OrderSide, OrderType, UserDataStreamEvent } from 'binance-api-node';
import moment from 'moment';
import logger from '../helpers/logger';
import binance, { Order } from '../api/binance';
import chalk from 'chalk';
import { StopLossManager } from './stopLossManager';
import { State } from './types';
import { coincap, PriceEvent } from '../api/coincap';

enum SymbolOrder {
  BTCUSDT = 'BTCUSDT',
}

export class Trade {
  private readonly DIP_THRESHOLD: number;
  private readonly UPWARD_TREND_THRESHOLD: number;
  private readonly TAKE_PROFIT_THRESHOLD: number;
  private readonly STOP_LOSS_THRESHOLD: number;
  private readonly LIMIT_THRESHOLD: number;

  private isAwait: boolean;
  private stopLossManager: StopLossManager;
  private openPrice: number | null;
  private side: OrderSide;
  private deposit: number;
  private orders: Order[];
  private percentageDiff: number;
  private activeOrder: Order | null;
  private price: number;
  private percentageDiffStopLoss: number;
  private state: State;

  constructor() {
    this.DIP_THRESHOLD = -0.2; //-2.25;
    this.UPWARD_TREND_THRESHOLD = 0.2; //1.5;
    this.TAKE_PROFIT_THRESHOLD = 0.2; //1.25;
    this.STOP_LOSS_THRESHOLD = -0.2; //-2;
    this.LIMIT_THRESHOLD = 0.05;

    this.isAwait = false;
    this.stopLossManager = new StopLossManager();
    this.openPrice = null;
    this.side = 'SELL';
    this.deposit = 100;
    this.orders = [];
    this.activeOrder = null;
    this.state = State.Received;
  }

  private async withAwait(callback: () => Promise<void>) {
    if (!this.isAwait) {
      try {
        this.isAwait = true;
        await callback();
      } catch (error) {
        throw error;
      } finally {
        this.isAwait = false;
      }
    }
  }

  async getBalances(): Promise<AssetBalance[]> {
    try {
      const accountInfo = await binance.accountInfo();
      return accountInfo.balances;
    } catch (error) {
      logger.logError(error);
      throw error;
    }
  }

  private getPercentageDiff(firstPrice: number, secondPrice: number): number {
    return ((secondPrice - firstPrice) / firstPrice) * 100;
  }

  private getQuantity(price: number, deposit: number): string {
    const quantityStr: string = String(deposit / price);
    return this.formatQuantity(quantityStr);
  }

  private getStopPrice(price: number, percentage: number) {
    let percentageWithThreshold: number;
    const absoluteSum = Math.abs(percentage) + this.LIMIT_THRESHOLD;

    if (Math.sign(percentage) === 1) {
      percentageWithThreshold = absoluteSum;
    } else {
      percentageWithThreshold = -absoluteSum;
    }

    return (price + price * (percentageWithThreshold / 100)).toFixed(2);
  }

  private getLimitPrice(price: number, percentage: number) {
    return (price + price * (percentage / 100)).toFixed(2);
  }

  private formatQuantity(quantityStr: string) {
    return quantityStr.slice(0, quantityStr.lastIndexOf('.') + 6);
  }

  private isCanMakeOrder(percentageDiff: number, threshold: number, activeOrder: Order | null): boolean {
    if (threshold > 0) {
      return activeOrder === null && percentageDiff >= threshold / 2;
    }

    return activeOrder === null && percentageDiff <= threshold / 2;
  }

  private isChangedMarketPriceDirection(percentageDiff: number, activeOrder: Order | null): boolean {
    if (activeOrder) {
      if (activeOrder.side === 'BUY') {
        if (activeOrder.type === 'TAKE_PROFIT_LIMIT' && percentageDiff >= 0) {
          return true;
        } else if (activeOrder.type === 'STOP_LOSS_LIMIT' && percentageDiff <= 0) {
          return true;
        }
      } else if (activeOrder.side === 'SELL') {
        if (activeOrder.type === 'TAKE_PROFIT_LIMIT' && percentageDiff <= 0) {
          return true;
        } else if (activeOrder.type === 'STOP_LOSS_LIMIT' && percentageDiff >= 0) {
          return true;
        }
      }
    }

    return false;
  }

  private get isTakeProfitBuy(): boolean {
    return this.side === 'BUY' && this.percentageDiff < 0;
  }

  private get isStopLossBuy(): boolean {
    return this.side === 'BUY' && this.percentageDiff > 0;
  }

  private get isTakeProfitSell(): boolean {
    return this.side === 'SELL' && this.percentageDiff > 0;
  }

  private get isStopLossSell(): boolean {
    return this.side === 'SELL' && this.percentageDiff < 0;
  }

  private get orderType(): OrderType {
    const isTakeProfit: boolean = this.isTakeProfitBuy || this.isTakeProfitSell;
    const isStopLoss: boolean = this.isStopLossBuy || this.isStopLossSell;

    if (isTakeProfit) {
      return 'TAKE_PROFIT_LIMIT';
    } else if (isStopLoss) {
      return 'STOP_LOSS_LIMIT';
    }
  }

  private get threshold(): number {
    if (this.isTakeProfitBuy) {
      return this.DIP_THRESHOLD;
    } else if (this.isStopLossBuy) {
      return this.UPWARD_TREND_THRESHOLD;
    } else if (this.isTakeProfitSell) {
      return this.TAKE_PROFIT_THRESHOLD;
    } else if (this.isStopLossSell) {
      return this.STOP_LOSS_THRESHOLD;
    }
  }

  log() {
    console.log(
      `${moment(Date.now()).format('HH:mm:ss.SSS')} ${this.price} ${this.percentageDiff} ${this.percentageDiffStopLoss}`
    );
  }

  private async listenPrice(price: number) {
    try {
      if (this.state !== State.Pending) {
        if (!this.openPrice) {
          this.openPrice = price;
        }

        this.price = price;

        this.percentageDiff = this.getPercentageDiff(this.openPrice, price);
        const percentageDiffStopLoss = this.getPercentageDiff(this.stopLossManager.averagePrice, price);

        this.percentageDiffStopLoss = percentageDiffStopLoss;

        /**
         * Поток ордеров
         */
        if (this.isCanMakeOrder(this.percentageDiff, this.threshold, this.activeOrder)) {
          if (this.isStopLossSell) {
            console.log('stop loss save [start]');
            this.stopLossManager.save(this.getQuantity(price, this.deposit), price);
            this.side = 'BUY';
            console.log('stop loss save [completed]');
            this.log();
          } else {
            console.log('new order main [start]');
            this.log();
            this.state = State.Pending;
            this.activeOrder = await binance.order({
              symbol: SymbolOrder.BTCUSDT,
              type: this.orderType,
              stopPrice: this.getStopPrice(price, this.threshold),
              side: this.side,
              quantity: this.getQuantity(price, this.deposit),
              price: this.getLimitPrice(price, this.threshold),
              newOrderRespType: 'RESULT',
            });
          }
        }

        if (this.isChangedMarketPriceDirection(this.percentageDiff, this.activeOrder)) {
          console.log('cancel order main [start]');
          this.log();
          this.state = State.Pending;
          await binance.cancelOrder({ symbol: SymbolOrder.BTCUSDT, orderId: this.activeOrder.orderId });
          // this.activeOrder = null;
        }

        /**
         * Поток стоплосс ордера
         */
        if (this.isCanMakeOrder(percentageDiffStopLoss, this.TAKE_PROFIT_THRESHOLD, this.stopLossManager.activeOrder)) {
          console.log('new order stop loss [start]');
          this.log();
          this.state = State.Pending;
          this.stopLossManager.activeOrder = await binance.order({
            symbol: SymbolOrder.BTCUSDT,
            type: 'TAKE_PROFIT_LIMIT',
            stopPrice: this.getStopPrice(price, this.TAKE_PROFIT_THRESHOLD),
            side: 'SELL',
            quantity: this.formatQuantity(String(this.stopLossManager.amountQuantity)),
            price: this.getLimitPrice(price, this.TAKE_PROFIT_THRESHOLD),
            newOrderRespType: 'RESULT',
          });
        }

        if (this.isChangedMarketPriceDirection(percentageDiffStopLoss, this.stopLossManager.activeOrder)) {
          console.log('cancel order stop loss [start]');
          this.log();
          this.state = State.Pending;
          await binance.cancelOrder({ symbol: SymbolOrder.BTCUSDT, orderId: this.stopLossManager.activeOrder.orderId });
          // this.stopLossManager.activeOrder = null;
        }
      }
    } catch (error) {
      console.log(error);
    }
  }

  private listenOrder(event: UserDataStreamEvent) {
    if (event.eventType === 'executionReport') {
      switch (event.orderStatus) {
        case 'FILLED': {
          if (this.activeOrder && event.orderId === this.activeOrder.orderId) {
            this.activeOrder = null;
            this.side = this.side === 'BUY' ? 'SELL' : 'BUY';
            this.openPrice = null;

            if (event.side === 'SELL') {
              this.deposit = Number(event.totalQuoteTradeQuantity);
            }
            console.log('new order [completed]');
          }

          if (this.activeOrder && event.orderId === this.stopLossManager.activeOrder.orderId) {
            this.stopLossManager.clear();
            console.log('new order stop loss [completed]');
          }

          logger.add({
            time: event.orderTime,
            side: event.side,
            price: event.price,
            quantity: event.quantity,
            usd: event.totalQuoteTradeQuantity,
            isProfit: event.orderType === 'TAKE_PROFIT_LIMIT',
          });

          break;
        }
      }

      switch (event.executionType) {
        case 'NEW': {
          this.state = State.Received;
        }
        case 'CANCELED': {
          if (this.activeOrder && event.orderId === this.activeOrder.orderId) {
            this.activeOrder = null;
            console.log('cancel order main [completed]');
          }
          if (this.stopLossManager.activeOrder && event.orderId === this.stopLossManager.activeOrder.orderId) {
            this.stopLossManager.activeOrder = null;
            // console.log(chalk.bgBlueBright('cancel order main'));
            console.log('cancel order stop loss [completed]');
          }

          this.state = State.Received;

          break;
        }
      }
    }
  }

  async getOrders() {
    return await binance.openOrders({ symbol: SymbolOrder.BTCUSDT });
  }

  run() {
    try {
      // coincap.addEventListener('message', (event: MessageEvent<string>) => {
      //   const trade = JSON.parse(event.data) as PriceEvent;
      //   if (trade.base === 'bitcoin' && trade.quote === 'tether' && trade.direction === this.side.toLowerCase()) {
      //     this.listenPrice(trade.price);
      //   }
      // });
      // binance.ws.user((event) => this.listenOrder.call(this, event));
    } catch (error) {
      throw error;
    }
  }
}
