import { binance } from '../../binance';
import { ExecutionReportEvent } from '../../trade/types';
import { defineWebsocketEvent } from '../../trade/utils';
import { OrderStatusHandlers } from './types';

export abstract class ExecutionReportEventHandler {
  private handlers: OrderStatusHandlers;

  constructor() {
    this.handlers = {
      NEW: this.new,
      FILLED: this.filled,
      CANCELED: this.canceled,
      EXPIRED: this.expired,
      PENDING_CANCEL: this.pendingCancel,
      REJECTED: this.rejected,
    };

    this.startListening();
  }

  protected new(payload: ExecutionReportEvent) {}

  protected filled(payload: ExecutionReportEvent) {}

  protected canceled(payload: ExecutionReportEvent) {}

  protected expired(payload: ExecutionReportEvent) {}

  protected pendingCancel(payload: ExecutionReportEvent) {}

  protected rejected(payload: ExecutionReportEvent) {}

  protected startListening() {
    binance.websocket.addEventListener('message', this.orderStatusListener(this.handlers));
  }

  protected stopListening() {
    binance.websocket.removeEventListener('message', this.orderStatusListener(this.handlers));
  }

  private orderStatusListener(handlers: OrderStatusHandlers) {
    return (event: MessageEvent) => {
      const payload = defineWebsocketEvent(JSON.parse(event.data)) as ExecutionReportEvent;

      const handler = handlers[payload.orderStatus];

      if (handler) {
        handler(payload);
      }
    };
  }
}
