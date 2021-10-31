import { binanceRestPrivate } from '../binance';
import { CancelOcoParams, Side, SymbolToken, Threshold } from './types';

export class TradeFacade {
  private threshold: Threshold;
  private side: Side;
  private symbol: SymbolToken;

  constructor() {
    this.threshold = {
      buy: {
        takeProfit: -0.2,
        stopLoss: 0.2,
      },
      sell: {
        takeProfit: 0.2,
        stopLoss: -0.2,
      },
      limit: 0.05,
    };

    this.side = Side.Buy;
    this.symbol = SymbolToken.Btcusdt;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async cancelOrder(id: number): Promise<any> {
    const response = await binanceRestPrivate.delete('/order', {
      params: { symbol: this.symbol, orderId: id },
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return response.data;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async cancelOrders(): Promise<any> {
    const response = await binanceRestPrivate.delete('/openOrders', {
      params: { symbol: this.symbol } as CancelOcoParams,
    });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return response.data;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getOpenOrders(): Promise<any> {
    const response = await binanceRestPrivate.get('/openOrders', { params: { symbol: this.symbol } });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return response.data;
  }
}
