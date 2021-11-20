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
    try {
      const response = await binanceRestPrivate.post<OrderDto>('/order', null, {
        params: {
          symbol: this.symbol,
          side,
          type,
          quantity,
          price: getPrice(this.threshold, side, type, price, false),
          stopPrice: getPrice(this.threshold, side, type, price, true),
          newOrderRespType: OrderResponseType.Result,
          timeInForce: TimeInForce.Gtc,
        } as OrderDtoRequest,
      });

      return response.data;
    } catch (error) {
      throw new Error('CommonOrder error from method expose');
      // return await this.expose(side, price, quantity, type);
    }
  }

  async cancel(order: OrderDto): Promise<void> {
    try {
      await binanceRestPrivate.delete('/order', {
        params: { symbol: this.symbol, orderId: order.orderId },
      });
    } catch (error) {
      console.log(new Error('CommonOrder error from method cancel'));
      return await this.cancel(order);
    }
  }
}
