import { binanceRestPrivate } from '../../binance';
import { IOrderPlacer } from '../interfaces';
import { Order, OrderRequest, OrderResponseType, OrderType, Side, SymbolToken, Threshold, TimeInForce } from '../types';
import { getPrice } from '../utils';

export class OrderPlacer implements IOrderPlacer {
  private readonly symbol: SymbolToken;
  private readonly threshold: Threshold;

  constructor(symbol: SymbolToken, threshold: Threshold) {
    this.symbol = symbol;
    this.threshold = threshold;
  }

  async expose(side: Side, price: number, quantity: string, type: OrderType): Promise<Order> {
    try {
      const response = await binanceRestPrivate.post<Order>('/order', null, {
        params: {
          symbol: this.symbol,
          side,
          type,
          quantity,
          price: getPrice(this.threshold, side, type, price, false),
          stopPrice: getPrice(this.threshold, side, type, price, true),
          newOrderRespType: OrderResponseType.Result,
          timeInForce: TimeInForce.Gtc,
        } as OrderRequest,
      });

      return response.data;
    } catch (error) {
      console.log(new Error('OrderPlacer error from method expose'));
      throw error;
      // return await this.expose(side, price, quantity, type);
    }
  }

  async cancel(order: Order): Promise<void> {
    try {
      await binanceRestPrivate.delete('/order', {
        params: { symbol: this.symbol, orderId: order.orderId },
      });
      console.log(`cancel ${order.orderId}`);
    } catch (error) {
      console.log(new Error('OrderPlacer error from method cancel'));
      // return await this.cancel(order);
      throw error;
    }
  }
}
