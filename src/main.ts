import express from 'express';
import './env';
import { initBinanceRest, initBinanceWebsocket } from './binance';
import { TradeFacade } from './trade/tradeFacade';
import { Bot } from './trade/bot';

const app = express();
const port = 5000;
const trade = new TradeFacade();
const bot = new Bot();

app.get('/cancelAll', async (req, res) => {
  res.send(await trade.cancelOrders());
});

app.get('/cancelOne', async (req, res) => {
  res.send(await trade.cancelOrder(Number(req.query.id)));
});

app.get('/openOrders', async (req, res) => {
  res.send(await trade.getOpenOrders());
});

app.listen(port, async () => {
  try {
    initBinanceRest();
    await initBinanceWebsocket();
    bot.start();

    console.log('Bot is running!');
  } catch (error) {
    console.log(error);
    throw error;
  }
});
