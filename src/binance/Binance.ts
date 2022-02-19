/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import ReconnectingWebSocket from 'reconnecting-websocket';
import { getSignature } from './utils';
import WebSocket from 'ws';
import { CronJob } from 'cron';
import { BinanceTimer } from './BinanceTimer';
import { delay } from '../trade/utils';

export class Binance {
  // @ts-ignore
  restPrivate: AxiosInstance;
  // @ts-ignore
  restPublic: AxiosInstance;
  // @ts-ignore
  websocket: ReconnectingWebSocket;
  baseUrl: string;
  timer: BinanceTimer;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.timer = new BinanceTimer();
  }

  initRest(): void {
    this.restPublic = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'X-MBX-APIKEY': process.env.BINANCE_API_KEY,
      },
    });

    this.restPrivate = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'X-MBX-APIKEY': process.env.BINANCE_API_KEY,
      },
    });

    const onFulfilledRequest = async (config: AxiosRequestConfig) => {
      if (this.timer.time === null) {
        await this.timer.getServerTime();
      }

      config.params.timestamp = this.timer.time;
      config.params.recvWindow = 5000;
      delete config.params.signature;
      config.params.signature = getSignature(config.params);

      return config;
    };

    const onRejectedResponse = (instance: AxiosInstance) => async (error: AxiosError) => {
      if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
        console.log('sleep...');
        await delay(60000);

        return instance.request(error.config);
      } else {
        console.log(error.response?.data);
      }

      return Promise.reject(error);
    };

    this.restPrivate.interceptors.request.use(onFulfilledRequest);
    this.restPrivate.interceptors.response.use(undefined, onRejectedResponse(this.restPrivate));
    this.restPublic.interceptors.response.use(undefined, onRejectedResponse(this.restPublic));
  }

  async initWebsocket(): Promise<void> {
    const { listenKey } = (await this.restPublic.post<{ listenKey: string }>('/userDataStream')).data;

    this.websocket = new ReconnectingWebSocket(`${process.env.BINANCE_WS_URL as string}/${listenKey}`, [], {
      WebSocket,
      connectionTimeout: 10000,
    });

    new CronJob(
      '30 * * * *',
      () => {
        void this.restPublic.put('/userDataStream', null, { params: { listenKey } });
        console.log('update userDataStream');
      },
      null,
      true
    );
  }
}

export const binance = new Binance(`${process.env.BINANCE_API_URL as string}/api/v3`);
