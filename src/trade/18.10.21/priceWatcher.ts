import moment from 'moment';
import { binanceRestPublic } from '../../binance';
import { Symbol } from '../types';

interface IPriceWatcher {
  price: number;
  watch: () => Promise<number>;
  trackingPrice: () => void;
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

  trackingPrice() {
    try {
      setInterval(async () => {
        this.price = await this.watch();
        console.log(`${moment().format('HH:mm:ss')} [PRICE]: ${this.price} `);
      }, 10 * 1000);
    } catch (error) {
      return Promise.reject(new Error('Price watcher error from method trackingPrice'));
    }
  }
}
