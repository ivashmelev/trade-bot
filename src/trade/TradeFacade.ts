import { binanceWebsocket } from '../binance';
import { Order } from './interfaces';
import {
  CommonOrderAdapterForStopLossRepositoryCleaner,
  CommonOrderAdapterForStopLossRepositorySaver,
  StopLossRepository,
} from './orderRepository';
import { CommonOrder, OcoOrder } from './orders';
import { CommonOrderAdapterForСancelingOrder, OrderPriceObserver, OrderPricePublisher } from './priceObserver';
import { Event, OrderStatus, OrderType, Side, SymbolToken, Threshold } from './types';
import { parseExecutionReportEvents, setIntervalAsync } from './utils';

export class TradeFacade {
  private orderPricePublisher: OrderPricePublisher;
  private orderPriceObserver: OrderPriceObserver;
  private ocoOrder: OcoOrder;
  private sellOrder: Order;
  private stopLossOrder: Order;
  private stopLossRepository: StopLossRepository;
  private threshold: Threshold;
  private side: Side;
  private deposit: number;

  constructor(symbol: SymbolToken, threshold: Threshold, deposit: number) {
    this.orderPricePublisher = new OrderPricePublisher(symbol);
    this.orderPriceObserver = new OrderPriceObserver();
    this.stopLossRepository = new StopLossRepository();
    this.ocoOrder = new OcoOrder(symbol, threshold);

    this.sellOrder = new CommonOrderAdapterForСancelingOrder(
      new CommonOrderAdapterForStopLossRepositorySaver(new CommonOrder(symbol, threshold), this.stopLossRepository),
      this.orderPriceObserver,
      threshold
    );

    this.stopLossOrder = new CommonOrderAdapterForСancelingOrder(
      new CommonOrderAdapterForStopLossRepositoryCleaner(new CommonOrder(symbol, threshold), this.stopLossRepository),
      this.orderPriceObserver,
      threshold
    );
    this.threshold = threshold;
    this.side = Side.Buy;
    this.deposit = deposit;

    this.orderPricePublisher.subscribe(this.orderPriceObserver);
  }

  async trade(): Promise<void> {
    await this.orderPricePublisher.startGetPrice();
    await this.stopLossRepository.getOrders();

    await setIntervalAsync(async () => {
      if (!this.stopLossOrder.orderResponse && this.orderPriceObserver.price >= this.stopLossRepository.averagePrice) {
        await this.stopLossOrder.expose(
          Side.Sell,
          this.orderPriceObserver.price,
          this.stopLossRepository.amountQuantity,
          OrderType.TakeProfitLimit
        );
      }
    }, 1000);

    binanceWebsocket.addEventListener('message', (e) => {
      void (async () => {
        const event = parseExecutionReportEvents(e);

        if (event.eventType === Event.ExecutionReport) {
          switch (event.orderStatus) {
            case OrderStatus.Filled: {
              if (event.side === Side.Buy) {
                await this.sellOrder.expose(
                  Side.Sell,
                  this.orderPriceObserver.price,
                  this.quantity,
                  OrderType.TakeProfitLimit
                );
              } else if (event.orderId === this.sellOrder.orderResponse?.orderId) {
                await this.ocoOrder.expose(Side.Buy, this.orderPriceObserver.price, this.quantity);
              }

              break;
            }
          }
        }
      })();
    });
  }

  private get quantity(): string {
    const quantityStr = String(this.deposit / this.orderPriceObserver.price);
    return quantityStr.slice(0, quantityStr.lastIndexOf('.') + 6);
  }
}
