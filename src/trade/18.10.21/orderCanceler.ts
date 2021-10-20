import { binanceRestPrivate } from '../../binance';
import { Symbol } from '../types';

interface IOrderCanceler {
  cancel: (id: number) => Promise<void>;
}

export class OrderCanceler implements IOrderCanceler {
  private symbol: Symbol;

  constructor(symbol: Symbol) {
    this.symbol = symbol;
  }

  async cancel(id: number) {
    try {
      const response = await binanceRestPrivate.delete('/order', {
        params: { symbol: this.symbol, orderId: id },
      });

      return response.data;
    } catch (error) {
      return Promise.reject(new Error('Order canceler error from method cancel'));
    }
  }
}
