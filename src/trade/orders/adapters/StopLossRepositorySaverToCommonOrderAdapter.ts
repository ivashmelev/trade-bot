import { CommonOrder } from '..';
import { StopLossRepository } from '../../orderRepository';
import { Side, OrderDto, SymbolToken, Threshold } from '../../types';

export class StopLossRepositorySaverToCommonOrderAdapter extends CommonOrder {
  private stopLossRepository: StopLossRepository;

  constructor(stopLossRepository: StopLossRepository, symbol: SymbolToken, threshold: Threshold) {
    super(symbol, threshold);
    this.stopLossRepository = stopLossRepository;
  }

  async cancel(order: OrderDto): Promise<void> {
    await super.cancel(order);

    if (order.side === Side.Sell) {
      await this.stopLossRepository.save(order.price, order.origQty);
    }
  }
}
