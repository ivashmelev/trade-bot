import { binanceRestPublic } from '../../binance';
import { Symbol } from '../types';

interface IPriceWatcher {
  price: number;
  watch: () => Promise<number>;
}

export class PriceWatcher implements IPriceWatcher {
  private symbol: Symbol;
  price: number;

  constructor(symbol: Symbol) {
    this.symbol = symbol;
  }

  async watch() {
    try {
      const response = await binanceRestPublic.get<{
        symbol: Symbol;
        price: string;
      }>('/ticker/price', { params: { symbol: this.symbol } });

      return Number(response.data.price);
    } catch (error) {
      return Promise.reject(new Error('Price watcher error from method watch'));
    }
  }
}
