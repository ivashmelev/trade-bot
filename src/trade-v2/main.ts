import express from 'express';
import { Trade } from './Trade';

const app = express();
const port = 5000;

const bot = new Trade();

app.listen(port, async () => {
  try {
    console.log('Bot is running!');
    await bot.launch();
  } catch (error) {
    console.log(error);
    throw error;
  }
});
