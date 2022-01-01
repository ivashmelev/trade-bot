import { IPriceObserver } from '../interfaces';
import { binanceRestPublic } from '../../binance';
import { SymbolToken } from '../types';
import { setIntervalAsync } from '../utils';
import moment from 'moment';
import { CronJob } from 'cron';

export class PriceObserver implements IPriceObserver {
  price: number | null;
  private readonly symbol: SymbolToken;

  constructor(symbol: SymbolToken) {
    this.price = null;
    this.symbol = symbol;
  }

  async startGetPrice(): Promise<void> {
    // let i = 0;
    // await setIntervalAsync(async () => {
    //   // i += 1;
    //   try {
    //     const response = await binanceRestPublic.get<{ symbol: SymbolToken; price: string }>('/ticker/price', {
    //       params: { symbol: this.symbol },
    //     });
    //
    //     this.price = Number(response.data.price);
    //     // console.log(i);
    //     console.log(`${moment().format('HH:mm:ss.SSS')}: ${this.price}`);
    //   } catch (error) {
    //     console.log(new Error('PriceObserver error from method startGetPrice'));
    //     throw error;
    //   }
    // }, 1000);

    async function* generate(symbol: SymbolToken, start: number, end: number) {
      try {
        for (let i = start; i <= end; i++) {
          const response = await binanceRestPublic.get<{ symbol: SymbolToken; price: string }>('/ticker/price', {
            params: { symbol },
          });

          const price = Number(response.data.price);

          yield price;
        }

        // console.log(i);
        // console.log(`${moment().format('HH:mm:ss.SSS')}: ${this.price}`);
      } catch (error) {
        console.log(new Error('PriceObserver error from method startGetPrice'));
        throw error;
      }
    }

  }
}
