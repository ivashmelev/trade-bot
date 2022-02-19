import express from 'express';
import { Trade } from './Trade';
import { SymbolToken, Threshold } from '../trade/types';

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

app.get('/getAccount', async (req, res) => {
  res.send(await bot.getAccount());
});

app.listen(port, async () => {
  try {
    console.log('Bot is running!');
    await bot.launch();
  } catch (error) {
    console.log(error);
    throw error;
  }
});
