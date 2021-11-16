import { binanceWebsocket } from '../binance';
import { StopLossRepository } from './orderRepository';
import {
  CommonOrder,
  OcoOrder,
  CommonOrderAdapterForStopLossRepositoryCleaner,
  CommonOrderAdapterForStopLossRepositorySaver,
} from './orders';
import { OrderPriceObserver, OrderPricePublisher } from './priceObserver';
import { Event, OrderStatus, OrderType, Side, SymbolToken, Threshold } from './types';
import { calcValueByPercentage, parseExecutionReportEvents, setIntervalAsync } from './utils';

export class TradeFacade {
  private orderPricePublisher: OrderPricePublisher;
  private orderPriceObserver: OrderPriceObserver;
  private ocoOrder: OcoOrder;
  private sellOrder: CommonOrder;
  private stopLossOrder: CommonOrder;
  private stopLossRepository: StopLossRepository;
  private threshold: Threshold;
  private side: Side;
  private deposit: number;

  constructor(symbol: SymbolToken, threshold: Threshold, deposit: number) {
    this.orderPricePublisher = new OrderPricePublisher(symbol);
    this.orderPriceObserver = new OrderPriceObserver();
    this.stopLossRepository = new StopLossRepository();
    this.ocoOrder = new OcoOrder(symbol, threshold);
    this.sellOrder = new CommonOrderAdapterForStopLossRepositorySaver(this.stopLossRepository, symbol, threshold);
    this.stopLossOrder = new CommonOrderAdapterForStopLossRepositoryCleaner(this.stopLossRepository, symbol, threshold);
    this.threshold = threshold;
    this.side = Side.Buy;
    this.deposit = deposit;

    this.orderPricePublisher.subscribe(this.orderPriceObserver);
  }

  async trade(): Promise<void> {
    let sellOrderTimeot: { id: NodeJS.Timeout };
    let stopLossOrderTimeot: { id: NodeJS.Timeout };

    await this.orderPricePublisher.startGetPrice();
    await this.stopLossRepository.getOrders();

    await setIntervalAsync(async () => {
      if (!this.stopLossOrder.order && this.orderPriceObserver.price >= this.stopLossRepository.averagePrice) {
        await this.stopLossOrder.expose(
          Side.Sell,
          this.orderPriceObserver.price,
          this.stopLossRepository.amountQuantity,
          OrderType.TakeProfitLimit
        );

        stopLossOrderTimeot = await setIntervalAsync(
          async () => await this.handleCancelingSellOrder(this.stopLossOrder),
          1000
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

                sellOrderTimeot = await setIntervalAsync(
                  async () => await this.handleCancelingSellOrder(this.sellOrder),
                  1000
                );
              } else if (event.orderId === this.sellOrder.order?.orderId) {
                this.sellOrder.order = undefined;
                clearTimeout(sellOrderTimeot.id);
                await this.ocoOrder.expose(Side.Buy, this.orderPriceObserver.price, this.quantity);
              } else if (event.orderId === this.stopLossOrder.order?.orderId) {
                this.stopLossOrder.order = undefined;
                clearTimeout(stopLossOrderTimeot.id);
              }

              break;
            }

            case OrderStatus.Canceled: {
              if (event.orderId === this.sellOrder.order?.orderId) {
                this.sellOrder.order = undefined;
                clearTimeout(sellOrderTimeot.id);
              } else if (event.orderId === this.stopLossOrder.order?.orderId) {
                this.stopLossOrder.order = undefined;
                clearTimeout(stopLossOrderTimeot.id);
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

  private async handleCancelingSellOrder(order: CommonOrder): Promise<void> {
    if (
      this.orderPriceObserver.price <=
      calcValueByPercentage(Number(order.order?.price), this.threshold.SELL.STOP_LOSS_LIMIT)
    ) {
      await order.cancel();
    }
  }
}
