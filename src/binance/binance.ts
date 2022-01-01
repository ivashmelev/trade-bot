import axios, { AxiosError, AxiosInstance } from 'axios';
import ReconnectingWebSocket from 'reconnecting-websocket';
import { getSignature } from './utils';
import WebSocket from 'ws';

export let binanceRestPrivate: AxiosInstance;
export let binanceRestPublic: AxiosInstance;
export let binanceWebsocket: ReconnectingWebSocket;

const url = `${process.env.BINANCE_API_URL as string}/api/v3`;

export const initBinanceRest = (): void => {
  try {
    binanceRestPublic = axios.create({
      baseURL: url,
      headers: {
        'X-MBX-APIKEY': process.env.BINANCE_API_KEY,
      },
    });

    // binanceRestPublic.interceptors.request.use(
    //   (config) => {
    //     return config;
    //   },
    //   (error: AxiosError) => {
    //     console.log(error);
    //
    //     return Promise.reject(error);
    //   }
    // );
    //
    // binanceRestPublic.interceptors.response.use(
    //   (config) => {
    //     return config;
    //   },
    //   (error: AxiosError) => {
    //     console.log(error);
    //
    //     return Promise.reject(error);
    //   }
    // );

    binanceRestPrivate = axios.create({
      baseURL: url,
      headers: {
        'X-MBX-APIKEY': process.env.BINANCE_API_KEY,
      },
      params: {
        recvWindow: 5000,
      },
    });

    binanceRestPrivate.interceptors.request.use(
      async (config) => {
        const timeResponse = await binanceRestPublic.get<{ serverTime: string }>('/time');
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        config.params.timestamp = timeResponse.data.serverTime;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        config.params.signature = getSignature(config.params);

        return config;
      },
      (error: AxiosError) => {
        console.log(error.config.url, error.code, error.response?.statusText);

        return Promise.reject(error);
      }
    );

    binanceRestPrivate.interceptors.response.use(undefined, (error: AxiosError) => {
      console.log(
        error.config.url,
        error.config.method,
        error.response?.statusText,
        JSON.stringify(error.response?.data, null, 2),
        JSON.stringify(error.config.params, null, 2)
      );

      return Promise.reject(error);
    });
  } catch (error) {
    console.log(error);
  }
};

export const initBinanceWebsocket = async (): Promise<void> => {
  try {
    const { listenKey } = (await binanceRestPublic.post<{ listenKey: string }>('/userDataStream')).data;

    binanceWebsocket = new ReconnectingWebSocket(`${process.env.BINANCE_WS_URL as string}/${listenKey}`, [], {
      WebSocket,
      connectionTimeout: 10000,
    });

    setInterval(() => {
      void binanceRestPublic.put('/userDataStream', null, { params: { listenKey } });
    }, 30 * 60000);
  } catch (error) {
    console.log(error);
  }
};
