import { binanceRestPrivate } from '../../binance';
import { Order, OrderType, Side, SymbolToken, Threshold, TimeInForce } from '../types';
import { calcValueByPercentage } from '../utils';
import { Oco, OcoParams, OrderParams, OrderResponse } from './types';

export class OrderPlacer {
  private symbol: SymbolToken;
  private threshold: Threshold;

  constructor(symbol: SymbolToken, threshold: Threshold) {
    this.symbol = symbol;
    this.threshold = threshold;
  }

  private getPrice(side: Side, type: OrderType, price: number, isLimit: boolean): string {
    if (isLimit) {
      return calcValueByPercentage(price, this.threshold[side][type] + this.threshold.limit).toFixed(2);
    }
    return calcValueByPercentage(price, this.threshold[side][type]).toFixed(2);
  }

  async placeOco(side: Side, price: number, quantity: string): Promise<Oco> {
    try {
      const response = await binanceRestPrivate.post<Oco>('/order/oco', null, {
        params: {
          symbol: this.symbol,
          side,
          quantity,
          price: this.getPrice(side, OrderType.TakeProfitLimit, price, false), // Limit Price
          stopPrice: this.getPrice(side, OrderType.StopLossLimit, price, false), // Last Price
          stopLimitPrice: this.getPrice(side, OrderType.StopLossLimit, price, true), // Stop Price
          stopLimitTimeInForce: TimeInForce.Gtc,
        } as OcoParams,
      });

      return response.data;
    } catch (error) {
      console.log(new Error('Order placer error from method placeOco'));
      return await this.placeOco(side, price, quantity);
    }
  }

  async placeOrder(type: OrderType, side: Side, price: number, quantity: string): Promise<Order> {
    try {
      const response = await binanceRestPrivate.post<Order>('/order', null, {
        params: {
          symbol: this.symbol,
          type,
          price: this.getPrice(side, type, price, false),
          stopPrice: this.getPrice(side, type, price, true),
          side,
          quantity,
          newOrderRespType: OrderResponse.Result,
          timeInForce: TimeInForce.Gtc,
        } as OrderParams,
      });

      return response.data;
    } catch (error) {
      console.log(new Error('Order placer error from method placeOrder'));
      return await this.placeOrder(type, side, price, quantity);
    }
  }
}
