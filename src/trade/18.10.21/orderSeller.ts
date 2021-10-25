import { binanceRestPrivate } from '../../binance';
import { Order, OrderParams, OrderResponse, OrderType, Side, TimeInForce, Symbol } from '../types';
import { calcValueByPercentage } from '../utils';
import { PriceWatcher } from './priceWatcher';

interface IOrderSeller {
  orderId: number;
  placeSellOrder: () => Promise<Order>;
}

export class OrderSeller implements IOrderSeller {
  orderId: number;
  private symbol: Symbol;
  private deposit: number;
  private threshold: number;
  private limitThreshold: number;
  private priceWatcher: PriceWatcher;

  constructor(symbol: Symbol, deposit: number, threshold: number, limitThreshold: number, priceWatcher: PriceWatcher) {
    this.symbol = symbol;
    this.deposit = deposit;
    this.threshold = threshold;
    this.limitThreshold = limitThreshold;
    this.priceWatcher = priceWatcher;
  }

  private get price() {
    return calcValueByPercentage(this.priceWatcher.price, this.threshold).toFixed(2);
  }

  private get stopPrice() {
    return calcValueByPercentage(this.priceWatcher.price, this.threshold + this.limitThreshold).toFixed(2);
  }

  private get quantity(): string {
    const quantityStr: string = String(this.deposit / this.priceWatcher.price);
    return quantityStr.slice(0, quantityStr.lastIndexOf('.') + 6);
  }

  async placeSellOrder() {
    try {
      this.priceWatcher.price = await this.priceWatcher.watch();

      const response = await binanceRestPrivate.post<Order>('/order', null, {
        params: {
          symbol: this.symbol,
          type: OrderType.TakeProfitLimit,
          price: this.price,
          stopPrice: this.stopPrice,
          side: Side.Sell,
          quantity: this.quantity,
          newOrderRespType: OrderResponse.Result,
          timeInForce: TimeInForce.Gtc,
        } as OrderParams,
      });

      return response.data;
    } catch (error) {
      return Promise.reject(new Error('Take profit seller error method placeSellOrder'));
    }
  }
}
