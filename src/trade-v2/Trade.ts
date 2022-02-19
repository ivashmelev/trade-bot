import '../env';
import { PriceObserver } from './PriceObserver/PriceObserver';
import { Side, SymbolToken, Threshold } from '../trade/types';
import { OrderService } from './OrderService/types';
import { BaseOrderService } from './OrderService/BaseOrderService';
import { TriggerImmediatelyErrorHandler } from './adapters/TriggerImmediatelyErrorHandler';
import { StopLossOrderRepositorySaver } from './adapters/StopLossOrderRepositorySaver';
import { StopLossOrderRepository } from './OrderRepository/StopLossOrderRepository';
import { OrderCanceller } from './adapters/OrderCanceller';
import { StopLossOrderRepositoryCleaner } from './adapters/StopLossOrderRepositoryCleaner';
import { binance } from '../binance';
import { BuyOrSellReportHandler } from './ExecutionReportEventHandler/BuyOrSellReportHandler';

export class Trade {
  private readonly priceObserver: PriceObserver;
  private readonly buyOrderService: OrderService;
  private readonly sellOrderService: OrderService;
  private stopLossSellOrder: OrderService;
  private readonly side: Side;
  private readonly deposit: number;
  private symbol: SymbolToken;
  private threshold: Threshold;
  private readonly stopLossOrderRepository: StopLossOrderRepository;
  private buyOrSellReportHandler: BuyOrSellReportHandler;

  constructor(symbol: SymbolToken, threshold: Threshold, deposit: number) {
    this.symbol = symbol;
    this.threshold = threshold;
    this.side = Side.Buy;
    this.deposit = deposit;

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

    this.buyOrSellReportHandler = new BuyOrSellReportHandler(
      this.buyOrderService,
      this.sellOrderService,
      this.side,
      this.priceObserver,
      this.deposit
    );
  }

  async launch() {
    await this.initialization();
    await this.buyOrSellReportHandler.launch();
  }

  private async initialization() {
    binance.initRest();
    await binance.initWebsocket();
    await this.priceObserver.launchPriceOverview();
    await this.stopLossOrderRepository.getStoredOrders();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async cancelOrders(): Promise<any> {
    const response = await binance.restPrivate.delete('/openOrders', {
      params: { symbol: this.symbol },
    });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return response.data;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getOpenOrders(): Promise<any> {
    const response = await binance.restPrivate.get('/openOrders', { params: { symbol: this.symbol } });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return response.data;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getExchangeInfo(): Promise<any> {
    const response = await binance.restPublic.get('/exchangeInfo', { params: { symbol: this.symbol } });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return response.data;
  }

  async getAccount(): Promise<any> {
    const response = await binance.restPrivate.get('/account', { params: {} });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return response.data;
  }
}
