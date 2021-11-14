import { binanceRestPublic } from '../../binance';
import { PriceObserver, PricePublisher } from '../interfaces';
import { SymbolToken } from '../types';
import { setIntervalAsync } from '../utils';

export class OrderPricePublisher implements PricePublisher {
  private observers: PriceObserver[];
  private symbol: SymbolToken;
  price: number;

  constructor(symbol: SymbolToken) {
    this.symbol = symbol;
  }

  subscribe(observer: PriceObserver): void {
    this.observers.push(observer);
  }

  unsubscribe(observer: PriceObserver): void {
    const index = this.observers.indexOf(observer);

    if (index === -1) {
      console.log('OrderPricePublisher error from method unsubscribe');
    } else {
      this.observers.splice(index, 1);
    }
  }

  notify(): void {
    this.observers.forEach((observer) => observer.updatePrice(this));
  }

  async startGetPrice(): Promise<void> {
    await setIntervalAsync(async () => {
      const response = await binanceRestPublic.get<{ symbol: SymbolToken; price: string }>('/ticker/price', {
        params: { symbol: this.symbol },
      });

      this.price = Number(response.data.price);
      this.notify();
    }, 1000);
  }
}
