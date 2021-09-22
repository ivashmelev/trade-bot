import axios, { AxiosInstance } from 'axios';
import { getSignature } from './utils';

export let binanceRequest: AxiosInstance;

const url = `${process.env.BINANCE_API_URL}/api/v3`;

export const initBinance = async () => {
  const timeResponse = await axios.get<{ serverTime: string }>(`${url}/time`);
  const timestamp = timeResponse.data.serverTime;

  binanceRequest = axios.create({
    baseURL: url,
    headers: {
      'X-MBX-APIKEY': process.env.BINANCE_API_KEY,
    },
    params: {
      timestamp,
      recvWindow: 10000,
    },
  });

  binanceRequest.interceptors.request.use((config) => {
    config.params.signature = getSignature(config.params);
    return config;
  });
};
