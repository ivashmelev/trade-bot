import chalk from 'chalk';
import fs from 'fs';
import moment from 'moment';
import { time } from './utils';
import { Error, Order } from './types';
import prisma from '../../database';

type Log = Order | Error;

class Logger {
  /**
   * Логи
   */
  logs: Log[];

  constructor() {
    this.logs = [];
  }

  /**
   * Добавление логов
   * @param log Лог
   */
  public add(log: Log) {
    Logger.console(log);
    Logger.file(log);
    Logger.database(log);

    this.logs.push(log);
  }

  /**
   * Вывод логов в консоль
   * @param log Лог
   */
  private static console(log: Log) {
    if ('side' in log) {
      const str = `${time(log.time)} [${log.side}]: ${log.quantity} by ${log.price}, result - ${log.usd}`;
      if (log.isProfit) {
        console.log(chalk.bgGreenBright.whiteBright.bold(str));
      } else {
        console.log(chalk.bgRedBright.whiteBright.bold(str));
      }
    } else {
      let str = `${time(log.time)} [ERROR]:`;
      str += log.message && ` ${log.message}`;
      str += log.url && ` in ${log.url}`;
      console.log(chalk.bgGray.whiteBright(str));
    }
  }

  /**
   * Запись логов в файл
   * @param log Лог
   */
  private static file(log: Log) {
    const filename = moment().format('DD.MM.YY');

    const writeStream = fs.createWriteStream(`./logs/${filename}.json`, {
      flags: 'a',
    });

    writeStream.write(`${JSON.stringify(log, null, 2)},\n`, (error) => {
      if (error) {
        throw error;
      }
    });
  }

  /**
   * Запись логов в БД
   * @param log
   */
  private static database(log: Log) {
    if ('side' in log) {
      prisma.log.create({ data: log }).catch((error) => {
        console.log(error);
      });
    } else {
      prisma.error.create({ data: log }).catch((error) => {
        console.log(error);
      });
    }
  }

  /**
   * Запись ошибок в логи
   * @param error ошибка
   */
  logError(error: Error) {
    this.add({
      time: Date.now(),
      message: error?.message,
      url: error?.url,
    });
  }
}

export default Logger;
