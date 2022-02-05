import { binance } from '../../binance';
import { IOrderPlacer } from '../interfaces';
import {
  Order,
  OrderRequest,
  OrderResponseError,
  OrderResponseType,
  OrderType,
  Side,
  SymbolToken,
  Threshold,
  TimeInForce,
} from '../types';
import { getPrice } from '../utils';
import { AxiosError } from 'axios';

export class OrderPlacer implements IOrderPlacer {
  private readonly symbol: SymbolToken;
  private readonly threshold: Threshold;

  constructor(symbol: SymbolToken, threshold: Threshold) {
    this.symbol = symbol;
    this.threshold = threshold;
  }

  async place(side: Side, price: number, quantity: string, type?: OrderType): Promise<Order> {
    try {
      const response = await binance.restPrivate.post<Order>('/order', null, {
        params: {
          symbol: this.symbol,
          side,
          type,
          quantity,
          price: getPrice(this.threshold, side, type || OrderType.TakeProfitLimit, price, false),
          stopPrice: getPrice(this.threshold, side, type || OrderType.TakeProfitLimit, price, true),
          newOrderRespType: OrderResponseType.Result,
          timeInForce: TimeInForce.Gtc,
        } as OrderRequest,
      });

      return response.data;
    } catch (e) {
      const error = e as AxiosError<OrderResponseError>;
      console.log(new Error('OrderPlacer error from method place'));

      if (error.response?.data.code === -2010) {
        const response = await binance.restPublic.get<{ price: string }>('/ticker/price', {
          params: {
            symbol: this.symbol,
          },
        });
        const price = Number(response.data.price);
        return await this.place(side, price, quantity, type);
      } else {
        throw error;
      }
    }
  }

  async cancel(order: Order): Promise<void> {
    try {
      await binance.restPrivate.delete('/order', {
        params: { symbol: this.symbol, orderId: order.orderId },
      });
    } catch (error) {
      console.log(new Error('OrderPlacer error from method cancel'));
      throw error;
    }
  }
}
