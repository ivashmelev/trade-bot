import { binanceRestPrivate } from '../binance';
import { Order, OrderParams, OrderResponse, OrderType, Side, TimeInForce, SymbolToken } from './types';
import { calcValueByPercentage } from './utils';
import { PriceWatcher } from './priceWatcher';
import { StopLossRepository } from './stopLossRepository';

interface IStopLossRepositorySeller {
  orderId: number;
  isHaveActiveOrder: boolean;
  placeSellOrder: () => Promise<Order>;
}

export class StopLossRepositorySeller implements IStopLossRepositorySeller {
  private symbol: SymbolToken;
  private threshold: number;
  private limitThreshold: number;
  private stopLossRepository: StopLossRepository;
  private priceWatcher: PriceWatcher;

  orderId: number;
  isHaveActiveOrder: boolean;

  constructor(
    symbol: SymbolToken,
    threshold: number,
    limitThreshold: number,
    stopLossRepository: StopLossRepository,
    priceWatcher: PriceWatcher
  ) {
    this.symbol = symbol;
    this.threshold = threshold;
    this.limitThreshold = limitThreshold;
    this.stopLossRepository = stopLossRepository;
    this.priceWatcher = priceWatcher;
    this.isHaveActiveOrder = false;
  }

  get averagePrice(): number {
    const sum = this.stopLossRepository.orders.reduce((prev, value) => {
      return prev + Number(value.price);
    }, 0);

    return sum / this.stopLossRepository.orders.length;
  }

  private get amountQuantity(): number {
    return this.stopLossRepository.orders.reduce((prev, value) => {
      return prev + Number(value.quantity);
    }, 0);
  }

  private get price() {
    return calcValueByPercentage(this.priceWatcher.price, this.threshold).toFixed(2);
  }

  private get stopPrice() {
    return calcValueByPercentage(this.priceWatcher.price, this.threshold + this.limitThreshold).toFixed(2);
  }

  private get quantity() {
    const amountQuantityStr = String(this.amountQuantity);
    return amountQuantityStr.slice(0, amountQuantityStr.lastIndexOf('.') + 6);
  }

  async placeSellOrder(): Promise<Order> {
    try {
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
      return Promise.reject(new Error('Stop loss repository seller error from method placeSellOrder'));
    }
  }
}