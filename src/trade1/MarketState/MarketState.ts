import { binanceRestPrivate } from '../../binance';
import { Order, SymbolToken } from '../types';
import { setIntervalAsync } from '../utils';

export class MarketState {
  private symbol: SymbolToken;
  activeOrders: Order[];

  constructor(symbol: SymbolToken) {
    this.symbol = symbol;
    this.activeOrders = [];
  }

  async startStateUpdate(): Promise<void> {
    await setIntervalAsync(async () => {
      try {
        const response = await binanceRestPrivate.get<Order[]>('/openOrders', { params: { symbol: this.symbol } });

        this.activeOrders = response.data;
        console.log(this.activeOrders.length);
      } catch (error) {
        return Promise.reject(new Error('Market state error from method startStateUpdate'));
      }
    }, 1000);
  }
}
