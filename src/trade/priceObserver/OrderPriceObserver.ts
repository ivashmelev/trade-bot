import { PriceObserver, PricePublisher } from '../interfaces';

export class OrderPriceObserver implements PriceObserver {
  price: number;

  updatePrice(pricePublisher: PricePublisher): void {
    this.price = pricePublisher.price;
  }
}
