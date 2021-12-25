import { IOrderObserver } from '../interfaces';
import { Order, SymbolToken } from '../types';
import { binanceRestPrivate } from '../../binance';

export class OrderObserver implements IOrderObserver {
  private readonly symbol: SymbolToken;

  constructor(symbol: SymbolToken) {
    this.symbol = symbol;
  }

  async checkOrder(order: Order): Promise<Order> {
    try {
      const response = await binanceRestPrivate.get<Order>('/order', {
        params: { symbol: this.symbol, orderId: order.orderId },
      });

      return response.data;
    } catch (error) {
      console.log(new Error('OrderObserver error from method checkOrder'));
      return await this.checkOrder(order);
    }
  }

  async getOpenOrders(): Promise<Order[]> {
    try {
      const response = await binanceRestPrivate.get<Order[]>('/openOrders', {
        params: { symbol: this.symbol },
      });

      return response.data;
    } catch (error) {
      console.log(new Error('OrderObserver error from method checkOrder'));
      return await this.getOpenOrders();
    }
  }
}
