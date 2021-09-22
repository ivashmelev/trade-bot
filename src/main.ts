import express from 'express';
import './env';
import { Trade } from './trade/trade';
import { SymbolOrder } from './trade/types';
import { binanceRequest, initBinance } from './binance';

const app = express();
const port = 5000;
const trade = new Trade();

// app.get('/cancel', async (req, res) => {
//   await binance.cancelOpenOrders({ symbol: SymbolOrder.BTCUSDT });
// });

// app.get('/balance', async (req, res) => {
//   console.log(await trade.getBalances());
//   res.send('');
// });

app.get('/log', async (req, res) => {
  try {
    console.log(binanceRequest);
    const response = await binanceRequest.get('/openOrders', { params: { symbol: SymbolOrder.BTCUSDT } });
    res.send(response.data);
  } catch (error) {
    console.log(error);
    res.send(error);
  }
});

app.get('/orders', async (req, res) => {
  res.send(await trade.getOrders());
});

app.listen(port, async () => {
  await initBinance();
  console.log('Bot is running!');
  // await trade.trading();
  // trade.run();
});
