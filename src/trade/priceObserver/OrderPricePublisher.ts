import interval from 'interval-promise';
import { binanceRestPublic } from '../../binance';
import { PriceObserver, PricePublisher } from '../interfaces';
import { SymbolToken } from '../types';

export class OrderPricePublisher implements PricePublisher {
  private observers: PriceObserver[];
  private symbol: SymbolToken;
  price: number;

  constructor(symbol: SymbolToken) {
    this.symbol = symbol;
    this.observers = [];
  }

  subscribe(observer: PriceObserver): void {
    this.observers.push(observer);
  }

  unsubscribe(observer: PriceObserver): void {
    const index = this.observers.indexOf(observer);

    if (index === -1) {
      console.log(new Error('OrderPricePublisher error from method unsubscribe'));
    } else {
      this.observers.splice(index, 1);
    }
  }

  notify(): void {
    this.observers.forEach((observer) => observer.updatePrice(this));
  }

  async startGetPrice(): Promise<void> {
    await interval(async () => {
      try {
        const response = await binanceRestPublic.get<{ symbol: SymbolToken; price: string }>('/ticker/price', {
          params: { symbol: this.symbol },
        });

        this.price = Number(response.data.price);
        console.log(this.price);
        this.notify();
      } catch (error) {
        console.log(new Error('OrderPricePublisher error from method unsubscribe'));
      }
    }, 1000);
  }
}
