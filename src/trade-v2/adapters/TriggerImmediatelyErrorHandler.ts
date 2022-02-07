import { OrderService } from '../OrderService/types';
import { Oco, Order, OrderResponseError, Side, SymbolToken } from '../../trade/types';
import { AxiosError } from 'axios';
import { binance } from '../../binance';

/**
 * Обрабатывает ошибку при которой ордер выполняется мгновенно
 */
export class TriggerImmediatelyErrorHandler implements OrderService {
  private readonly symbol: SymbolToken;
  private orderService: OrderService;

  constructor(orderService: OrderService, symbol: SymbolToken) {
    this.orderService = orderService;
    this.symbol = symbol;
  }

  async place(side: Side, price: number, quantity: number): Promise<Order | Oco> {
    try {
      return await this.orderService.place(side, price, quantity);
    } catch (e) {
      const error = e as AxiosError<OrderResponseError>;

      if (error.response?.data.msg === 'Order would trigger immediately.') {
        const response = await binance.restPublic.get<{ price: string }>('/ticker/price', {
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

  async cancel(order: Order | Oco) {
    return await this.orderService.cancel(order);
  }
}
