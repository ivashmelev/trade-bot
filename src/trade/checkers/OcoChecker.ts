import { Checker } from '../interfaces';
import { Oco, SymbolToken } from '../types';
import { binanceRestPrivate } from '../../binance';

export class OcoChecker implements Checker<Oco> {
  private readonly symbol: SymbolToken;

  constructor(symbol: SymbolToken) {
    this.symbol = symbol;
  }

  async check(oco: Oco): Promise<Oco> {
    try {
      const response = await binanceRestPrivate.get<Oco>('/orderList', {
        params: { symbol: this.symbol, orderListId: oco.orderListId },
      });

      return response.data;
    } catch (error) {
      console.log(new Error('OcoObserver error from method checkOrder'));
      // return await this.check(oco);
      throw error;
    }
  }
}
