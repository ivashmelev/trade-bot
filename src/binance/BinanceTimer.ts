import { binance } from './Binance';

export class BinanceTimer {
  time: number | null;
  private timer: NodeJS.Timer;

  constructor() {
    this.time = null;
  }

  async getServerTime(): Promise<void> {
    try {
      const start = new Date().getTime();
      const response = await binance.restPublic.get<{ serverTime: string }>('/time');
      const serverTime = Number(response.data.serverTime);
      const end = new Date().getTime();
      const diff = new Date().getTime() - serverTime + (end - start) / 2;

      this.time = new Date(new Date().getTime() - diff).getTime();

      this.timer = setInterval(() => {
        this.time = new Date(new Date().getTime() - diff).getTime();
      }, 1000);
    } catch (e) {
      console.log('BinanceTimer error from method getServerTime');
      throw e;
    }
  }
}
