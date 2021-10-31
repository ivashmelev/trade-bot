import moment from 'moment';
import { binanceRestPublic } from '../binance';
import { SymbolToken } from './types';

interface IPriceWatcher {
  price: number;
  watch: () => Promise<number>;
  trackingPrice: () => void;
}

export class PriceWatcher implements IPriceWatcher {
  private symbol: SymbolToken;
  price: number;

  constructor(symbol: SymbolToken) {
    this.symbol = symbol;
  }

  async watch(): Promise<number> {
    try {
      const response = await binanceRestPublic.get<{
        symbol: SymbolToken;
        price: string;
      }>('/ticker/price', { params: { symbol: this.symbol } });

      return Number(response.data.price);
    } catch (error) {
      return Promise.reject(new Error('Price watcher error from method watch'));
    }
  }

  async trackingPrice(): Promise<void> {
    try {
      this.price = await this.watch();

      setInterval(async () => {
        this.price = await this.watch();
        console.log(`${moment().format('HH:mm:ss')} [PRICE]: ${this.price} `);
      }, 10 * 1000);
    } catch (error) {
      return Promise.reject(new Error('Price watcher error from method trackingPrice'));
    }
  }
}
