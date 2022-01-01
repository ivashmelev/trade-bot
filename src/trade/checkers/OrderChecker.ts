import { Checker } from '../interfaces';
import { Order, SymbolToken } from '../types';
import { binanceRestPrivate } from '../../binance';

export class OrderChecker implements Checker<Order> {
  private readonly symbol: SymbolToken;

  constructor(symbol: SymbolToken) {
    this.symbol = symbol;
  }

  async check(order: Order): Promise<Order> {
    try {
      const response = await binanceRestPrivate.get<Order>('/order', {
        params: { symbol: this.symbol, orderId: order.orderId },
      });

      return response.data;
    } catch (error) {
      console.log(new Error('OrderChecker error from method order'));
      // return await this.check(order);
      throw error;
    }
  }
}
