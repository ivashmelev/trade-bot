import { OrderPriceObserver, OrderPricePublisher } from './priceObserver';
import { SymbolToken } from './types';

export class TradeFacade {
  private orderPricePublisher: OrderPricePublisher;
  private orderPriceObserver: OrderPriceObserver;

  constructor(symbol: SymbolToken) {
    this.orderPricePublisher = new OrderPricePublisher(symbol);
    this.orderPriceObserver = new OrderPriceObserver();

    this.orderPricePublisher.subscribe(this.orderPriceObserver);
  }

  async trade(): Promise<void> {
    await this.orderPricePublisher.startGetPrice();
    console.log(this.orderPriceObserver.price);
  }
}
