import express from 'express';
import './env';
import { Trade } from './trade/Trade';
import { SymbolToken, Threshold } from './trade/types';

const app = express();
const port = 5000;
const threshold: Threshold = {
  BUY: {
    TAKE_PROFIT_LIMIT: -1,
    STOP_LOSS_LIMIT: 2,
  },
  SELL: {
    TAKE_PROFIT_LIMIT: 1,
    STOP_LOSS_LIMIT: -2,
  },
  limit: 0.1,
};

const bot = new Trade(SymbolToken.Btcusdt, threshold, 100);

app.get('/openOrders', async (req, res) => {
  res.send(await bot.getOpenOrders());
});

app.get('/cancelAll', async (req, res) => {
  res.send(await bot.cancelOrders());
});

app.get('/exchangeInfo', async (req, res) => {
  res.send(await bot.getExchangeInfo());
});

app.listen(port, async () => {
  try {
    console.log('Bot is running!');
    await bot.trade();
  } catch (error) {
    console.log(error);
    throw error;
  }
});
