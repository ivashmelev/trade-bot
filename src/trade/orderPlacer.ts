import { binanceRestPrivate } from '../binance';
import { PriceObserver } from './priceObserver';
import {
  Oco,
  OcoParams,
  Order,
  OrderParams,
  OrderResponse,
  OrderType,
  Side,
  Symbol,
  Threshold,
  TimeInForce,
} from './types';
import { calcValueByPercentage } from './utils';

interface IOrderPlacer {
  buyOcoId: number;
  sellOrderId: number;
  placeBuyOco: () => Promise<Oco>;
  placeSellOrder: () => Promise<Order>;
}

export class OrderPlacer implements IOrderPlacer {
  private threshold: Threshold;
  private symbol: Symbol;
  private deposit: number;
  private priceObserver: PriceObserver;
  buyOcoId: number;
  sellOrderId: number;

  constructor(symbol: Symbol, threshold: Threshold, deposit: number, priceObserver: PriceObserver) {
    this.symbol = symbol;
    this.threshold = threshold;
    this.deposit = deposit;
    this.priceObserver = priceObserver;
  }

  private get quantity(): string {
    const quantityStr: string = String(this.deposit / this.priceObserver.price);
    return quantityStr.slice(0, quantityStr.lastIndexOf('.') + 6);
  }

  async placeBuyOco() {
    try {
      this.priceObserver.price = await this.priceObserver.observ();

      const price = calcValueByPercentage(this.priceObserver.price, this.threshold.buy.takeProfit).toFixed(2);
      const stopPrice = calcValueByPercentage(this.priceObserver.price, this.threshold.buy.stopLoss).toFixed(2);
      const stopLimitPrice = calcValueByPercentage(
        this.priceObserver.price,
        this.threshold.buy.stopLoss + this.threshold.limit
      ).toFixed(2);

      const response = await binanceRestPrivate.post<Oco>('/order/oco', null, {
        params: {
          symbol: this.symbol,
          side: Side.Buy,
          quantity: this.quantity,
          price, // Limit Price
          stopPrice, // Last Price
          stopLimitPrice, // Stop Price
          stopLimitTimeInForce: TimeInForce.Gtc,
        } as OcoParams,
      });

      return response.data;
    } catch (error) {
      return Promise.reject(new Error('Order placer error method placeBuyOco'));
    }
  }

  async placeSellOrder() {
    try {
      this.priceObserver.price = await this.priceObserver.observ();

      const price = calcValueByPercentage(this.priceObserver.price, this.threshold.sell.takeProfit).toFixed(2);
      const stopPrice = calcValueByPercentage(
        this.priceObserver.price,
        this.threshold.sell.takeProfit + this.threshold.limit
      ).toFixed(2);

      const response = await binanceRestPrivate.post<Order>('/order', null, {
        params: {
          symbol: this.symbol,
          type: OrderType.TakeProfitLimit,
          price,
          stopPrice,
          side: Side.Sell,
          quantity: this.quantity,
          newOrderRespType: OrderResponse.Result,
          timeInForce: TimeInForce.Fok,
        } as OrderParams,
      });

      return response.data;
    } catch (error) {
      return Promise.reject(new Error('Order placer error method placeSellOrder'));
    }
  }
}
