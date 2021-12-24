import express from 'express';
import './env';
import { binanceRestPublic, initBinanceRest, initBinanceWebsocket } from './binance';
import { TradeFacade } from './trade/TradeFacade';
import { SymbolToken, Threshold } from './trade/types';
import { CronJob } from 'cron';
import axios from 'axios';

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

app.listen(port,  () => {
  try {
    // initBinanceRest();
    // await initBinanceWebsocket();
    // await bot.trade();
    // console.log('Bot is running!');
    const delay = (ms:number) => {
      return new Promise((resolve) => {
        setTimeout(resolve, ms);
      });
    }

    const schedule = (cronTime: string, callback: () => Promise<void>) => {
      const job = new CronJob(cronTime, async () => {
        job.stop()
        await callback();
        job.start()
      }, null, true)

      return job
    }

    let response;

    schedule('* * * * * *', async () => {
      await delay(3000)
      console.log('get response');
      response = 'response'
    })

    schedule('* * * * * *', async () => {
      await delay(1000)
      console.log(`use response ${response as string}`);
      response = undefined
    })

  } catch (error) {
    console.log(error);
    throw error;
  }
});
