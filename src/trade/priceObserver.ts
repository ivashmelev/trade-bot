import { binanceRestPublic } from '../binance';
import { Symbol } from './types';

interface IPriceObserver {
  price: number;
  observ: () => Promise<number>;
}

export class PriceObserver implements IPriceObserver {
  private symbol: Symbol;
  price: number;

  constructor(symbol: Symbol) {
    this.symbol = symbol;

    (async () => {
      this.price = await this.observ();
    })();
  }

  async observ() {
    try {
      const response = await binanceRestPublic.get<{
        symbol: Symbol;
        price: string;
      }>('/ticker/price', { params: { symbol: this.symbol } });

      return Number(response.data.price);
    } catch (error) {
      return Promise.reject(new Error('Price observer error method observ'));
    }
  }
}
