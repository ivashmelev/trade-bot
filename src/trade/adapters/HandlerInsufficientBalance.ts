import { IPlacer } from '../interfaces';
import { AccountInformation, BalanceAssets, OrderErrorMessage, OrderResponseError, OrderType, Side } from '../types';
import { AxiosError } from 'axios';
import { CronJob } from 'cron';
import { binance } from '../../binance';

export class HandlerInsufficientBalance<T> implements IPlacer<T> {
  private placer: IPlacer<T>;
  private job: CronJob;
  private isWaiting: boolean;
  private deposit: number;

  constructor(placer: IPlacer<T>, deposit: number) {
    this.placer = placer;
    this.isWaiting = false;
    this.deposit = deposit;
    this.job = this.createCheckBalanceJob();
  }

  async place(side: Side, price: number, quantity: string, type?: OrderType): Promise<T> {
    try {
      return await this.placer.place(side, price, quantity, type);
    } catch (e) {
      const error = e as AxiosError<OrderResponseError>;

      if (error.response?.data.msg === OrderErrorMessage.InsufficientBalance) {
        await this.pause();
      }
      throw error;
    }
  }

  async cancel(order: T): Promise<void> {
    return await this.placer.cancel(order);
  }

  private pause() {
    return new Promise((resolve) => {
      const id = setInterval(() => {
        if (!this.isWaiting) {
          clearInterval(id);
          resolve(undefined);
        }
      }, 60000 * 5);
    });
  }

  private createCheckBalanceJob() {
    return new CronJob('0 * * * *', async () => {
      const response = await binance.restPrivate.get<AccountInformation>('/account');

      const balance = response.data.balances.find((balance) => balance.asset === BalanceAssets.Usdt);
    });
  }
}
