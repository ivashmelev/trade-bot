import express from 'express';
import './env';
import { initBinanceRest, initBinanceWebsocket } from './binance';
import { Trade } from './trade';
import { Symbol } from './trade/types';
import { TradeFacade } from './trade/tradeFacade';

const app = express();
const port = 5000;
const trade = new TradeFacade();

// app.get('/balance', async (req, res) => {
//   try {
//     res.send((await trade.getAccountInfo(['BTC', 'USDT'])).balances);
//   } catch (error) {
//     res.send(error);
//   }
// });

// app.get('/price', async (req, res) => {
//   res.send((await trade.getMarketPrice()).toFixed(2));
// });

// app.get('/oco', async (req, res) => {
//   res.send(await trade.createOco());
// });

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
    await initBinanceRest();
    await initBinanceWebsocket();
    trade.trading();
    console.log('Bot is running!');
  } catch (error) {
    console.log(error);
    throw error;
  }
});
