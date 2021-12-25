import { IPriceObserver } from '../interfaces';
import interval from 'interval-promise';
import { binanceRestPublic } from '../../binance';
import { SymbolToken } from '../types';

export class PriceObserver implements IPriceObserver {
  price: number;
  private readonly symbol: SymbolToken;

  constructor(symbol: SymbolToken) {
    this.symbol = symbol;
  }

  async startGetPrice(): Promise<void> {
    await interval(async () => {
      try {
        const response = await binanceRestPublic.get<{ symbol: SymbolToken; price: string }>('/ticker/price', {
          params: { symbol: this.symbol },
        });

        this.price = Number(response.data.price);
        console.log(this.price);
      } catch (error) {
        console.log(new Error('PriceObserver error from method startGetPrice'));
      }
    }, 1000);
  }
}
