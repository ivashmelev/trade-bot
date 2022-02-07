import { OrderService } from './types';
import {
  Oco,
  OcoRequest,
  Order,
  OrderRequest,
  OrderResponseType,
  OrderType,
  Side,
  SymbolToken,
  Threshold,
  TimeInForce,
} from '../../trade/types';
import { binance } from '../../binance';
import { calcValueByPercentage } from '../../trade/utils';

/**
 * Выставляет и отменяет ордера
 */
export class BaseOrderService implements OrderService {
  private readonly symbol: SymbolToken;
  private readonly threshold: Threshold;
  private readonly useOco: boolean;

  constructor(symbol: SymbolToken, threshold: Threshold, useOco?: boolean) {
    this.symbol = symbol;
    this.threshold = threshold;
    this.useOco = useOco ? useOco : false;
  }

  /**
   * Выставляет ордер
   * @param side Продажа/Покупка
   * @param price Цена
   * @param quantity Количество
   */
  async place(side: Side, price: number, quantity: number): Promise<Order | Oco> {
    if (this.useOco) {
      const response = await binance.restPrivate.post<Oco>('/order/oco', null, {
        params: {
          symbol: this.symbol,
          side,
          quantity: String(quantity),
          price: this.getPriceByThresholdAndType(side, OrderType.TakeProfitLimit, price, false), // Limit Price
          stopPrice: this.getPriceByThresholdAndType(side, OrderType.StopLossLimit, price, false), // Last Price
          stopLimitPrice: this.getPriceByThresholdAndType(side, OrderType.StopLossLimit, price, true), // Stop Price
          stopLimitTimeInForce: TimeInForce.Gtc,
        } as OcoRequest,
      });

      return response.data;
    } else {
      const response = await binance.restPrivate.post<Order>('/order', null, {
        params: {
          symbol: this.symbol,
          side,
          type: OrderType.TakeProfitLimit,
          quantity: String(quantity),
          price: this.getPriceByThresholdAndType(side, OrderType.TakeProfitLimit, price, false),
          stopPrice: this.getPriceByThresholdAndType(side, OrderType.TakeProfitLimit, price, true),
          newOrderRespType: OrderResponseType.Result,
          timeInForce: TimeInForce.Gtc,
        } as OrderRequest,
      });

      return response.data;
    }
  }

  /**
   * Отменяет выставленный ордер
   * @param order Ордер
   */
  async cancel(order: Order | Oco) {
    if (this.useOco) {
      const { orderListId } = order as Oco;

      await binance.restPrivate.delete('/orderList', {
        params: { symbol: this.symbol, orderListId },
      });
    } else {
      const { orderId } = order as Order;

      await binance.restPrivate.delete('/order', {
        params: { symbol: this.symbol, orderId },
      });
    }
  }

  private getPriceByThresholdAndType(side: Side, type: OrderType, price: number, isLimit: boolean): string {
    const percentage = this.threshold[side][type];

    const percentageWithLimitThreshold = Math.abs(
      Math.sign(percentage) > 0 ? percentage + this.threshold.limit : percentage - this.threshold.limit
    );

    if (isLimit) {
      return calcValueByPercentage(price, percentageWithLimitThreshold).toFixed(2);
    }
    return calcValueByPercentage(price, percentage).toFixed(2);
  }
}
