import express from 'express';
import './env';
import { initBinanceRest, initBinanceWebsocket } from './binance';
import { TradeFacade } from './trade/tradeFacade';
import { Trade } from './trade1';
import { SymbolToken } from './trade/types';

const app = express();
const port = 5000;
const trade = new TradeFacade();

const bot = new Trade(SymbolToken.Btcusdt, {
  BUY: {
    TAKE_PROFIT_LIMIT: -0.2,
    STOP_LOSS_LIMIT: 0.2,
  },
  SELL: {
    TAKE_PROFIT_LIMIT: 0.2,
    STOP_LOSS_LIMIT: -0.2,
  },
  limit: 0.1,
});

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
    await bot.startTrading();
    console.log('Bot is running!');
  } catch (error) {
    console.log(error);
    throw error;
  }
});
