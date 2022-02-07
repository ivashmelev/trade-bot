import '../env';
import { PriceObserver } from './PriceObserver/PriceObserver';
import { SymbolToken } from '../trade/types';

export class Trade {
  private priceObserver: PriceObserver;

  constructor() {
    this.priceObserver = new PriceObserver(SymbolToken.Btcusdt);
  }

  async launch() {
    await this.priceObserver.launchPriceOverview();
  }
}
