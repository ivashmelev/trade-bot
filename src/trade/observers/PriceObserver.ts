import { IPriceObserver } from '../interfaces';
import { SymbolToken } from '../types';
import moment from 'moment';
import ReconnectingWebSocket from 'reconnecting-websocket';
import WebSocket from 'ws';
import { CronJob } from 'cron';

export class PriceObserver implements IPriceObserver {
  price: number | null;
  private readonly symbol: SymbolToken;

  constructor(symbol: SymbolToken) {
    this.price = null;
    this.symbol = symbol;
  }

  async startGetPrice(): Promise<void> {
    return new Promise((resolve) => {
      // const ws = new ReconnectingWebSocket(
      //   `${process.env.BINANCE_WS_URL as string}/${this.symbol.toLowerCase()}@miniTicker`,
      //   [],
      //   {
      //     WebSocket,
      //   }
      // );
      //
      // ws.addEventListener('message', (e) => {
      //   const event = parseMiniTicker(e.data);
      //   this.price = Number(event.closePrice);
      //   console.log(`${moment().format('HH:mm:ss.SSS')}: ${this.price}`);
      //   resolve();
      // });

      // new CronJob(
      //   '* * * * * *',
      //   async () => {
      //     const response = await binanceRestPublic.get<{ price: string }>('/ticker/price', {
      //       params: {
      //         symbol: this.symbol,
      //       },
      //     });
      //
      //     this.price = Number(response.data.price);
      //     console.log(`${moment().format('HH:mm:ss.SSS')}: ${this.price}`);
      //
      //     resolve();
      //   },
      //   null,
      //   true
      // );

      const ws = new ReconnectingWebSocket('wss://ws.coincap.io/trades/binance', [], { WebSocket });

      ws.addEventListener('message', (event: MessageEvent) => {
        interface A {
          exchange: string;
          base: string;
          quote: string;
          direction: string;
          price: number;
          volume: number;
          timestamp: number;
          priceUsd: number;
        }
        const payload = JSON.parse(event.data) as A;

        if (payload.base === 'bitcoin' && payload.quote === 'tether') {
          this.price = payload.price;
          resolve();
        }
      });

      new CronJob(
        '1 * * * * *',
        () => {
          console.log(`${moment().format('HH:mm:ss.SSS')}: ${this.price!}`);
        },
        null,
        true
      );
    });
  }
}
