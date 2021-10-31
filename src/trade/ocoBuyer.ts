import { AxiosError } from 'axios';
import { binanceRestPrivate } from '../binance';
import { BinanceRequestError, Oco, OcoParams, Side, SymbolToken, TimeInForce } from './types';
import { calcValueByPercentage } from './utils';
import { PriceWatcher } from './priceWatcher';

interface IOcoBuyer {
  ocoId: number;
  placeBuyOco: () => Promise<Oco>;
}

export class OcoBuyer implements IOcoBuyer {
  ocoId: number;
  private symbol: SymbolToken;
  private deposit: number;
  private takeProfitThreshold: number;
  private stopLossThreshold: number;
  private limitThreshold: number;
  private priceWatcher: PriceWatcher;

  constructor(
    symbol: SymbolToken,
    deposit: number,
    takeProfitThreshold: number,
    stopLossThreshold: number,
    limitThreshold: number,
    priceWatcher: PriceWatcher
  ) {
    this.symbol = symbol;
    this.deposit = deposit;
    this.takeProfitThreshold = takeProfitThreshold;
    this.stopLossThreshold = stopLossThreshold;
    this.limitThreshold = limitThreshold;
    this.priceWatcher = priceWatcher;
  }

  private get price() {
    console.log('price in price', this.priceWatcher.price);
    return calcValueByPercentage(this.priceWatcher.price, this.takeProfitThreshold).toFixed(2);
  }

  private get stopPrice() {
    return calcValueByPercentage(this.priceWatcher.price, this.stopLossThreshold).toFixed(2);
  }

  private get stopLimitPrice() {
    return calcValueByPercentage(this.priceWatcher.price, this.stopLossThreshold + this.limitThreshold).toFixed(2);
  }

  private get quantity(): string {
    const quantityStr = String(this.deposit / this.priceWatcher.price);
    return quantityStr.slice(0, quantityStr.lastIndexOf('.') + 6);
  }

  async placeBuyOco(): Promise<Oco> {
    console.log('price', this.price);
    console.log('stopPrice', this.stopPrice);
    console.log('stopLimitPrice', this.stopLimitPrice);
    this.priceWatcher.price = await this.priceWatcher.watch();

    try {
      const response = await binanceRestPrivate.post<Oco>('/order/oco', null, {
        params: {
          symbol: this.symbol,
          side: Side.Buy,
          quantity: this.quantity,
          price: this.price, // Limit Price
          stopPrice: this.stopPrice, // Last Price
          stopLimitPrice: this.stopLimitPrice, // Stop Price
          stopLimitTimeInForce: TimeInForce.Gtc,
        } as OcoParams,
      });

      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<BinanceRequestError>;

      if (axiosError.response?.data.code === -2010) {
        return await this.placeBuyOco();
      }

      return Promise.reject(new Error('Oco buyer error from method placeBuyOco'));
    }
  }
}
