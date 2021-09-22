import Binance from 'binance-api-node';
import '../../env';
import { getTime } from './utils';

/**
 * SDK для работы с биржей
 */
const binance = Binance({
  httpBase: process.env.BINANCE_API_URL,
  apiKey: process.env.BINANCE_API_KEY,
  apiSecret: process.env.BINANCE_SECRET_KEY,
  wsBase: process.env.BINANCE_WS_URL,
  wsFutures: process.env.BINANCE_FUTURE_WS_URL,
  // getTime,
});

export type { Order, UserDataStreamEvent, OrderSide } from 'binance-api-node';

export default binance;
