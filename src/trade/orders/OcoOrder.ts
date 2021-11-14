import { binanceRestPrivate } from '../../binance';
import { Order } from '../interfaces';
import { OcoDto, OcoDtoRequest, OrderDto, OrderType, Side, SymbolToken, Threshold, TimeInForce } from '../types';
import { getPrice } from '../utils';

export class OcoOrder implements Order {
  private symbol: SymbolToken;
  private threshold: Threshold;

  constructor(symbol: SymbolToken, threshold: Threshold) {
    this.symbol = symbol;
    this.threshold = threshold;
  }

  async expose(side: Side, price: number, quantity: string): Promise<OrderDto> {
    try {
      const response = await binanceRestPrivate.post<OcoDto>('/order/oco', null, {
        params: {
          symbol: this.symbol,
          side,
          quantity,
          price: getPrice(this.threshold, side, OrderType.TakeProfitLimit, price, false), // Limit Price
          stopPrice: getPrice(this.threshold, side, OrderType.StopLossLimit, price, false), // Last Price
          stopLimitPrice: getPrice(this.threshold, side, OrderType.StopLossLimit, price, true), // Stop Price
          stopLimitTimeInForce: TimeInForce.Gtc,
        } as OcoDtoRequest,
      });

      return response.data.orderReports[0];
    } catch (error) {
      console.log('OcoOrder error from method expose');
      return await this.expose(side, price, quantity);
    }
  }

  async cancel(order: OrderDto): Promise<void> {
    try {
      await binanceRestPrivate.delete('/order', {
        params: { symbol: this.symbol, orderId: order.orderId },
      });
    } catch (error) {
      console.log(new Error('OcoOrder error from method cancel'));
      return await this.cancel(order);
    }
  }
}
