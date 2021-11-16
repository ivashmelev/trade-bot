import { CommonOrder } from '../../orders';
import { OrderPriceObserver } from '..';
import { OrderDto, OrderType, Side, SymbolToken, Threshold } from '../../types';

export class CommonOrderAdapterForCancellationOrder extends CommonOrder {
  private orderPriceObserver: OrderPriceObserver;

  constructor(orderPriceObserver: OrderPriceObserver, symbol: SymbolToken, threshold: Threshold) {
    super(symbol, threshold);
    this.orderPriceObserver = orderPriceObserver;
  }

  async expose(side: Side, price: number, quantity: string, type: OrderType): Promise<OrderDto> {
    return await super.expose(side, price, quantity, type);
  }
}
