import express from 'express';
import './env';
import { initBinanceRest, initBinanceWebsocket } from './binance';
import { TradeFacade } from './trade/TradeFacade';
import { SymbolToken } from './trade/types';

const app = express();
const port = 5000;
const bot = new TradeFacade(SymbolToken.Btcusdt);

// app.get('/test', (req, res) => {
//   res.send(bot.trade());
// });

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
