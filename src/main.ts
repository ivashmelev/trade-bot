import express from 'express';
import './env';
import { initBinanceRest, initBinanceWebsocket } from './binance';
import { TradeFacade } from './trade/TradeFacade';
import { SymbolToken, Threshold } from './trade/types';

const app = express();
const port = 5000;
const threshold: Threshold = {
  BUY: {
    TAKE_PROFIT_LIMIT: -0.2,
    STOP_LOSS_LIMIT: 0.2,
  },
  SELL: {
    TAKE_PROFIT_LIMIT: 0.2,
    STOP_LOSS_LIMIT: -0.2,
  },
  limit: 0.05,
};

const bot = new TradeFacade(SymbolToken.Btcusdt, threshold, 100);

app.get('/openOrders', async (req, res) => {
  res.send(await bot.getOpenOrders());
});

app.get('/cancelAll', async (req, res) => {
  res.send(await bot.cancelOrders());
});

app.listen(port, async () => {
  try {
    initBinanceRest();
    await initBinanceWebsocket();
    await bot.trade();
    console.log('Bot is running!');
  } catch (error) {
    console.log(error);
    throw error;
  }
});
