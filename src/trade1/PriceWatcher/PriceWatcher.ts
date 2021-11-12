import { binanceRestPublic } from '../../binance';
import { SymbolToken } from '../../trade/types';
import { setIntervalAsync } from '../utils';
import { TickerPriceParams } from './types';

export class PriceWatcher {
  private symbol: SymbolToken;
  price: number;

  constructor(symbol: SymbolToken) {
    this.symbol = symbol;
  }

  async startWatching(): Promise<void> {
    await setIntervalAsync(async () => {
      try {
        const response = await binanceRestPublic.get<TickerPriceParams>('/ticker/price', {
          params: { symbol: this.symbol },
        });

        this.price = Number(response.data.price);
        console.log(this.price);
      } catch (error) {
        return Promise.reject(new Error('Price watcher error from method startWatching'));
      }
    }, 1000);
  }
}
