import { binanceRestPrivate, binanceRestPublic } from '../../binance';
import { IOcoPlacer } from '../interfaces';
import { Oco, OcoRequest, OrderResponseError, OrderType, Side, SymbolToken, Threshold, TimeInForce } from '../types';
import { getPrice } from '../utils';
import { AxiosError } from 'axios';

export class OcoPlacer implements IOcoPlacer {
  private readonly symbol: SymbolToken;
  private readonly threshold: Threshold;

  constructor(symbol: SymbolToken, threshold: Threshold) {
    this.symbol = symbol;
    this.threshold = threshold;
  }

  async place(side: Side, price: number, quantity: string): Promise<Oco> {
    try {
      const response = await binanceRestPrivate.post<Oco>('/order/oco', null, {
        params: {
          symbol: this.symbol,
          side,
          quantity,
          price: getPrice(this.threshold, side, OrderType.TakeProfitLimit, price, false), // Limit Price
          stopPrice: getPrice(this.threshold, side, OrderType.StopLossLimit, price, false), // Last Price
          stopLimitPrice: getPrice(this.threshold, side, OrderType.StopLossLimit, price, true), // Stop Price
          stopLimitTimeInForce: TimeInForce.Gtc,
        } as OcoRequest,
      });

      return response.data;
    } catch (e) {
      const error = e as AxiosError<OrderResponseError>;
      console.log(new Error('OcoPlacer error from method place'));

      if (error.response?.data.code === -2010) {
        const response = await binanceRestPublic.get<{ price: string }>('/ticker/price', {
          params: {
            symbol: this.symbol,
          },
        });
        const price = Number(response.data.price);
        return await this.place(side, price, quantity);
      } else {
        throw error;
      }
    }
  }

  async cancel(oco: Oco): Promise<void> {
    try {
      await binanceRestPrivate.delete('/orderList', {
        params: { symbol: this.symbol, orderListId: oco.orderListId },
      });
    } catch (error) {
      console.log(new Error('OcoPlacer error from method cancel'));
      // return await this.cancel(oco);
      throw error;
    }
  }
}
