import { ExecutionReportEventHandler } from './abstract';
import { ExecutionReportEvent, Side } from '../../trade/types';
import chalk from 'chalk';
import moment from 'moment';
import { OrderService } from '../OrderService/types';
import { PriceObserver } from '../PriceObserver/PriceObserver';

export class BuyOrSellReportHandler extends ExecutionReportEventHandler {
  private activeOrderId: number | null;
  private buyOrderService: OrderService;
  private sellOrderService: OrderService;
  private side: Side;
  private priceObserver: PriceObserver;
  private readonly deposit: number;

  constructor(
    buyOrderService: OrderService,
    sellOrderService: OrderService,
    side: Side,
    priceObserver: PriceObserver,
    deposit: number
  ) {
    super();
    this.activeOrderId = null;
    this.buyOrderService = buyOrderService;
    this.sellOrderService = sellOrderService;
    this.side = side;
    this.priceObserver = priceObserver;
    this.deposit = deposit;
  }

  async launch() {
    super.launch();
    await this.buyOrSell();
  }

  protected new(payload: ExecutionReportEvent) {
    if (this.activeOrderId === null) {
      this.activeOrderId = payload.orderId;
      console.log(
        chalk.bgBlue(
          `${moment().format('HH:mm:ss.SSS')} [MT]: ${payload.orderStatus} ${payload.side} ${payload.orderId}`
        )
      );
    }
  }

  protected filled(payload: ExecutionReportEvent) {
    if (this.activeOrderId === payload.orderId) {
      console.log(
        chalk.bgGreen(
          `${moment().format('HH:mm:ss.SSS')} [MT]: ${payload.orderStatus} ${payload.side} ${payload.orderId}`
        )
      );
      this.activeOrderId = null;
      this.buyOrSell();
    }
  }

  protected canceled(payload: ExecutionReportEvent) {
    if (this.activeOrderId === payload.orderId) {
      console.log(
        chalk.bgRed(
          `${moment().format('HH:mm:ss.SSS')} [MT]: ${payload.orderStatus} ${payload.side} ${payload.orderId}`
        )
      );
      this.activeOrderId = null;
      this.buyOrSell();
    }
  }

  protected expired(payload: ExecutionReportEvent) {
    this.canceled(payload);
  }

  private async buyOrSell() {
    if (this.priceObserver.price) {
      const getQuantity = (price: number) => {
        const indexDot = 2;
        const possiblePrecision = 6;
        const quantity = this.deposit / price;
        const quantityArr = Array.from(String(quantity));
        const indexGreaterNull = quantityArr.findIndex((value) => Number(value) > 0);

        return Number(quantity.toPrecision(possiblePrecision - (indexGreaterNull - indexDot)));
      };

      if (this.priceObserver.price) {
        const quantity = getQuantity(this.priceObserver.price);

        if (this.side === Side.Buy) {
          await this.buyOrderService.place(Side.Buy, this.priceObserver.price, quantity);
        } else if (this.side === Side.Sell) {
          await this.sellOrderService.place(Side.Sell, this.priceObserver.price, quantity);
        }

        this.side = this.side === Side.Buy ? Side.Sell : Side.Buy;
      }
    }
  }
}
