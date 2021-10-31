import { binanceRestPrivate } from '../binance';
import { SymbolToken } from './types';

interface IOrderCanceler {
  cancel: (id: number) => Promise<void>;
}

export class OrderCanceler implements IOrderCanceler {
  private symbol: SymbolToken;

  constructor(symbol: SymbolToken) {
    this.symbol = symbol;
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
}
