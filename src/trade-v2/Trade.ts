import '../env';
import { PriceObserver } from './PriceObserver/PriceObserver';
import { SymbolToken, Threshold } from '../trade/types';
import { OrderService } from './OrderService/types';
import { BaseOrderService } from './OrderService/BaseOrderService';
import { TriggerImmediatelyErrorHandler } from './adapters/TriggerImmediatelyErrorHandler';
import { StopLossOrderRepositorySaver } from './adapters/StopLossOrderRepositorySaver';
import { OrderRepository } from './OrderRepository/types';
import { StopLossOrderRepository } from './OrderRepository/StopLossOrderRepository';
import { OrderCanceller } from './adapters/OrderCanceller';
import { StopLossOrderRepositoryCleaner } from './adapters/StopLossOrderRepositoryCleaner';
import { binance } from '../binance';

export class Trade {
  private priceObserver: PriceObserver;
  private buyOrderService: OrderService;
  private sellOrderService: OrderService;
  private stopLossSellOrder: OrderService;
  private symbol: SymbolToken;
  private threshold: Threshold;
  private stopLossOrderRepository: StopLossOrderRepository;

  constructor(symbol: SymbolToken, threshold: Threshold) {
    this.symbol = symbol;
    this.threshold = threshold;
    this.stopLossOrderRepository = new StopLossOrderRepository();
    this.priceObserver = new PriceObserver(SymbolToken.Btcusdt);

    this.buyOrderService = new TriggerImmediatelyErrorHandler(new BaseOrderService(symbol, threshold, true), symbol);

    this.sellOrderService = new TriggerImmediatelyErrorHandler(
      new OrderCanceller(
        new StopLossOrderRepositorySaver(new BaseOrderService(symbol, threshold), this.stopLossOrderRepository),
        this.priceObserver,
        threshold
      ),
      symbol
    );

    this.stopLossSellOrder = new TriggerImmediatelyErrorHandler(
      new OrderCanceller(
        new StopLossOrderRepositoryCleaner(new BaseOrderService(symbol, threshold), this.stopLossOrderRepository),
        this.priceObserver,
        threshold
      ),
      symbol
    );
  }

  async launch() {
    await this.initialization();
  }

  private async initialization() {
    binance.initRest();
    await binance.initWebsocket();
    await this.priceObserver.launchPriceOverview();
    await this.stopLossOrderRepository.getStoredOrders();
  }
}
