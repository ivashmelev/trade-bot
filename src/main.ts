import express from 'express';
import './env';
import { initBinanceRest, initBinanceWebsocket } from './binance';
import { Trade } from './trade';
import { Symbol } from './trade/types';

const app = express();
const port = 5000;
const trade = new Trade();

app.get('/balance', async (req, res) => {
  try {
    res.send((await trade.getAccountInfo(['BTC', 'USDT'])).balances);
  } catch (error) {
    console.log(error);
    res.send(error);
  }
});

app.get('/price', async (req, res) => {
  res.send((await trade.getMarketPrice()).toFixed(2));
});

app.get('/oco', async (req, res) => {
  res.send((await trade.createOco(Symbol.Btcusdt)).orderListId.toString());
});

app.get('/cancel', async (req, res) => {
  res.send(await trade.cancelOrders(Symbol.Btcusdt));
});

app.get('/openOrders', async (req, res) => {
  res.send(await trade.getOpenOrders(Symbol.Btcusdt));
});

app.listen(port, async () => {
  try {
    await initBinanceRest();
    await initBinanceWebsocket();
    trade.trading();
    console.log('Bot is running!');
  } catch (error) {
    console.log(error);
    throw error;
  }
});
