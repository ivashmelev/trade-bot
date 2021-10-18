import axios, { AxiosError, AxiosInstance } from 'axios';
import ReconnectingWebSocket from 'reconnecting-websocket';
import { getSignature } from './utils';
import WebSocket from 'ws';

export let binanceRestPrivate: AxiosInstance;
export let binanceRestPublic: AxiosInstance;
export let binanceWebsocket: ReconnectingWebSocket;

const url = `${process.env.BINANCE_API_URL}/api/v3`;

export const initBinanceRest = async () => {
  try {
    binanceRestPrivate = axios.create({
      baseURL: url,
      headers: {
        'X-MBX-APIKEY': process.env.BINANCE_API_KEY,
      },
      params: {
        recvWindow: 60000,
      },
    });

    binanceRestPrivate.interceptors.request.use(async (config) => {
      const timeResponse = await axios.get<{ serverTime: string }>(`${url}/time`);

      config.params.timestamp = timeResponse.data.serverTime;
      config.params.signature = getSignature(config.params);

      return config;
    });

    binanceRestPrivate.interceptors.response.use(undefined, (error: AxiosError) => {
      console.log(
        error.config.url,
        error.config.method,
        error.response!.statusText,
        JSON.stringify(error.response!.data, null, 2),
        JSON.stringify(error.config.params, null, 2)
      );

      return Promise.reject(error);
    });

    binanceRestPublic = axios.create({
      baseURL: url,
      headers: {
        'X-MBX-APIKEY': process.env.BINANCE_API_KEY,
      },
    });
  } catch (error) {
    console.log(error);
  }
};

export const initBinanceWebsocket = async () => {
  try {
    const { listenKey } = (await binanceRestPublic.post<{ listenKey: string }>('/userDataStream')).data;

    binanceWebsocket = new ReconnectingWebSocket(`${process.env.BINANCE_WS_URL}/${listenKey}`, [], {
      WebSocket,
      connectionTimeout: 10000,
    });

    setInterval(() => {
      binanceRestPublic.put('/userDataStream', null, { params: { listenKey } });
    }, 30 * 60000);
  } catch (error) {
    console.log(error);
  }
};
