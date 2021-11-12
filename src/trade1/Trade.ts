import chalk from 'chalk';
import moment from 'moment';
import { MarketState } from './MarketState';
import { OrderCanceler } from './OrderCanceler';
import { OrderPlacer } from './OrderPlacer';
import { PriceWatcher } from './PriceWatcher';
import { StopLossRepository } from './StopLossRepository';
import { OrderType, Side, SymbolToken, Threshold } from './types';
import { calcValueByPercentage, setIntervalAsync } from './utils';

export class Trade {
  private priceWatcher: PriceWatcher;
  private marketState: MarketState;
  private orderPlacer: OrderPlacer;
  private orderCanceler: OrderCanceler;
  private stopLossRepository: StopLossRepository;
  private side: Side;
  private threshold: Threshold;
  private deposit: number;

  constructor(symbol: SymbolToken, threshold: Threshold) {
    this.threshold = threshold;
    this.priceWatcher = new PriceWatcher(symbol);
    this.marketState = new MarketState(symbol);
    this.orderPlacer = new OrderPlacer(symbol, threshold);
    this.stopLossRepository = new StopLossRepository(symbol);
    this.orderCanceler = new OrderCanceler(symbol, this.priceWatcher, this.stopLossRepository);
    this.side = Side.Buy;
    this.deposit = 100;
  }

  private get quantity(): string {
    const quantityStr = String(this.deposit / this.priceWatcher.price);
    return quantityStr.slice(0, quantityStr.lastIndexOf('.') + 6);
  }

  private toggleSide() {
    this.side = this.side === Side.Buy ? Side.Sell : Side.Buy;
  }

  private async mainCircleTrade(): Promise<void> {
    const canPlaceNewOrder = () =>
      this.marketState.activeOrders.length === 0 ||
      this.marketState.activeOrders[0].orderId === this.stopLossRepository.activeOrder?.orderId;

    await setIntervalAsync(async () => {
      if (canPlaceNewOrder()) {
        if (this.side === Side.Buy) {
          const oco = await this.orderPlacer.placeOco(Side.Buy, this.priceWatcher.price, this.quantity);
          console.log(
            chalk.bgBlue(
              `${moment().format('HH:mm:ss.SSS')} PLACE BUY OCO ${oco.orderReports[0].orderId} ${
                oco.orderReports[1].orderId
              }`
            )
          );
          console.log(oco.orderReports[0]);
          console.log(oco.orderReports[1]);
          this.toggleSide();
        } else {
          const order = await this.orderPlacer.placeOrder(
            OrderType.TakeProfitLimit,
            Side.Sell,
            this.priceWatcher.price,
            this.quantity
          );

          console.log(chalk.bgBlue(`${moment().format('HH:mm:ss.SSS')} PLACE SELL ORDER ${order.orderId}`));
          console.log(order);

          this.orderCanceler.cancelWhenPriceIsReached(
            order,
            calcValueByPercentage(this.priceWatcher.price, this.threshold.SELL.STOP_LOSS_LIMIT)
          );

          this.toggleSide();
        }
      }
    }, 1000);
  }

  private async stopLossCircleTrade(): Promise<void> {
    await setIntervalAsync(async () => {
      if (this.priceWatcher.price > this.stopLossRepository.averagePrice && !this.stopLossRepository.isOrderPlaced) {
        this.stopLossRepository.activeOrder = await this.orderPlacer.placeOrder(
          OrderType.TakeProfitLimit,
          Side.Sell,
          this.priceWatcher.price,
          this.stopLossRepository.amountQuantity
        );

        console.log(
          chalk.bgBlue(
            `${moment().format('HH:mm:ss.SSS')} PLACE SELL STOP LOSS ORDER ${
              this.stopLossRepository.activeOrder.orderId
            }`
          )
        );
        console.log(this.stopLossRepository.activeOrder);

        this.stopLossRepository.isOrderPlaced = true;

        this.orderCanceler.cancelWhenPriceIsReached(
          this.stopLossRepository.activeOrder,
          calcValueByPercentage(this.priceWatcher.price, this.threshold.SELL.STOP_LOSS_LIMIT)
        );
      }
    }, 1000);
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  async startTrading(): Promise<void> {
    await this.priceWatcher.startWatching();
    await this.marketState.startStateUpdate();
    await this.orderCanceler.startTrackingPriceToCancel();
    // await this.stopLossRepository.startCheckStatusOrder();

    await this.mainCircleTrade();
    // await this.stopLossCircleTrade();
    // Реализовать несколько функция для основго цикла и цикла стоп лоссов
  }
}
