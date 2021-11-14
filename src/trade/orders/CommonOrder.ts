import { binanceRestPrivate } from '../../binance';
import { Order } from '../interfaces';
import {
  OrderDto,
  OrderDtoRequest,
  OrderResponseType,
  OrderType,
  Side,
  SymbolToken,
  Threshold,
  TimeInForce,
} from '../types';
import { getPrice } from '../utils';

export class CommonOrder implements Order {
  private symbol: SymbolToken;
  private threshold: Threshold;

  constructor(symbol: SymbolToken, threshold: Threshold) {
    this.symbol = symbol;
    this.threshold = threshold;
  }

  async expose(side: Side, price: number, quantity: string, type: OrderType): Promise<OrderDto> {
    const response = await binanceRestPrivate.post<OrderDto>('/order', null, {
      params: {
        symbol: this.symbol,
        side,
        type,
        quantity,
        price: getPrice(this.threshold, side, type, price, false),
        stopPrice: getPrice(this.threshold, side, type, price, true),
        stopLimitTimeInForce: TimeInForce.Gtc,
        newOrderRespType: OrderResponseType.Result,
        timeInForce: TimeInForce.Gtc,
      } as OrderDtoRequest,
    });

    return response.data;
  }

  async cancel(order: OrderDto): Promise<void> {
    try {
      await binanceRestPrivate.delete('/order', {
        params: { symbol: this.symbol, orderId: order.orderId },
      });
    } catch (error) {
      console.log(new Error('SellOrder error from method cancel'));
      return await this.cancel(order);
    }
  }
}
