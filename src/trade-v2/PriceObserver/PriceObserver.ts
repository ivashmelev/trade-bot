import { SymbolToken } from '../../trade/types';
import moment from 'moment';
import ReconnectingWebSocket from 'reconnecting-websocket';
import WebSocket from 'ws';
import { CronJob } from 'cron';
import { getEnviromentVariable } from '../../utils/getEnviromentVariable';
import { CoincapMessage } from './types';

/**
 * Наблюдение за ценой
 */
export class PriceObserver {
  price?: number;
  private readonly symbol: SymbolToken;

  constructor(symbol: SymbolToken) {
    this.symbol = symbol;
  }

  /**
   * Запускается только при инициализации бота
   */
  async launchPriceOverview(): Promise<number> {
    return new Promise((resolve) => {
      const ws = new ReconnectingWebSocket(getEnviromentVariable(process.env.COINCAP_WS_URL), [], { WebSocket });

      ws.onmessage = (event: MessageEvent) => {
        const payload = JSON.parse(event.data) as CoincapMessage;

        if (payload.base === 'bitcoin' && payload.quote === 'tether') {
          if (!this.price) {
            resolve(payload.price);
          }

          this.price = payload.price;
        }
      };

      ws.onerror = () => {
        throw new Error();
      };

      new CronJob(
        '* * * * * *', //'0 */5 * * * *',
        () => {
          console.log(`${moment().format('HH:mm:ss.SSS')}: ${this.price}`);
        },
        null,
        true
      );
    });
  }
}
