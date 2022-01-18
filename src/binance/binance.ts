/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import ReconnectingWebSocket from 'reconnecting-websocket';
import { getSignature } from './utils';
import WebSocket from 'ws';
import { CronJob } from 'cron';
import { BinanceTimer } from './BinanceTimer';
import { delay } from '../trade/utils';

export let binanceRestPrivate: AxiosInstance;
export let binanceRestPublic: AxiosInstance;
export let binanceWebsocket: ReconnectingWebSocket;

const url = `${process.env.BINANCE_API_URL as string}/api/v3`;

export const initBinanceRest = (): void => {
  binanceRestPublic = axios.create({
    baseURL: url,
    headers: {
      'X-MBX-APIKEY': process.env.BINANCE_API_KEY,
    },
  });

  binanceRestPrivate = axios.create({
    baseURL: url,
    headers: {
      'X-MBX-APIKEY': process.env.BINANCE_API_KEY,
    },
  });

  const binanceTimer = new BinanceTimer();

  const onFulfilledRequest = async (config: AxiosRequestConfig) => {
    if (binanceTimer.time === null) {
      await binanceTimer.getServerTime();
    }

    config.params.timestamp = binanceTimer.time;
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

  binanceRestPrivate.interceptors.request.use(onFulfilledRequest);
  binanceRestPrivate.interceptors.response.use(undefined, onRejectedResponse(binanceRestPrivate));
  binanceRestPublic.interceptors.response.use(undefined, onRejectedResponse(binanceRestPublic));
};

export const initBinanceWebsocket = async (): Promise<void> => {
  const { listenKey } = (await binanceRestPublic.post<{ listenKey: string }>('/userDataStream')).data;

  binanceWebsocket = new ReconnectingWebSocket(`${process.env.BINANCE_WS_URL as string}/${listenKey}`, [], {
    WebSocket,
    connectionTimeout: 10000,
  });

  new CronJob(
    '30 * * * *',
    () => {
      void binanceRestPublic.put('/userDataStream', null, { params: { listenKey } });
      console.log('update userDataStream');
    },
    null,
    true
  );
};
