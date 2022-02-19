import { binance } from '../../binance';
import { ExecutionReportEvent } from '../../trade/types';
import { defineWebsocketEvent } from '../../trade/utils';
import { OrderStatusHandlers } from './types';

export abstract class ExecutionReportEventHandler {
  private readonly handlers: OrderStatusHandlers;

  protected constructor() {
    this.handlers = {
      NEW: this.new.bind(this),
      FILLED: this.filled.bind(this),
      CANCELED: this.canceled.bind(this),
      EXPIRED: this.expired.bind(this),
      PENDING_CANCEL: this.pendingCancel.bind(this),
      REJECTED: this.rejected.bind(this),
    };
  }

  launch() {
    this.startListening();
  }

  protected new(payload: ExecutionReportEvent) {}

  protected filled(payload: ExecutionReportEvent) {}

  protected canceled(payload: ExecutionReportEvent) {}

  protected expired(payload: ExecutionReportEvent) {}

  protected pendingCancel(payload: ExecutionReportEvent) {}

  protected rejected(payload: ExecutionReportEvent) {}

  protected startListening() {
    binance.websocket.addEventListener('message', this.orderStatusListener(this.handlers).bind(this));
  }

  protected stopListening() {
    binance.websocket.removeEventListener('message', this.orderStatusListener(this.handlers).bind(this));
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
