import { binanceWebsocket } from '../binance';
import { Event, ExecutionReportEvent, OrderStatus } from './types';
import { parseExecutionReportEvents } from './utils';

type FnType = (event: ExecutionReportEvent) => void;

export class OrderListener {
  new: FnType;
  filled: FnType;
  expired: FnType;
  canceled: FnType;

  constructor(params: { new: FnType; filled: FnType; expired: FnType; cancelled: FnType }) {
    this.new = params.new;
    this.filled = params.filled;
    this.expired = params.expired;
    this.canceled = params.cancelled;

    binanceWebsocket.addEventListener('message', (e: MessageEvent<string>) => {
      const event = JSON.parse(e.data) as { e: Event };

      if (event.e === Event.ExecutionReport) {
        const payload = parseExecutionReportEvents(event);

        switch (payload.orderStatus) {
          case OrderStatus.New: {
            this.new(payload);
            break;
          }
          case OrderStatus.Filled: {
            this.filled(payload);
            break;
          }
          case OrderStatus.Expired: {
            this.expired(payload);
            break;
          }
          case OrderStatus.Canceled: {
            this.canceled(payload);
            break;
          }
        }
      }
    });
  }
}
