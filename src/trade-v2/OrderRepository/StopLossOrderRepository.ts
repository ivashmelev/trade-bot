import { OrderRepository } from './types';
import prisma from '../../database';
import { StopLossOrder } from '@prisma/client';

type StopLossOrderWithoutId = Omit<StopLossOrder, 'id'>;

/**
 * Работа с таблицей стоп-лосс ордеров
 */
export class StopLossOrderRepository implements OrderRepository {
  private orders: StopLossOrderWithoutId[];

  constructor() {
    this.orders = [];
  }

  /**
   * Средняя цена всех сохраненных стоп-лосс ордеров
   */
  get averagePrice(): number {
    const sum = this.orders.reduce((prev, value) => {
      return prev + Number(value.price);
    }, 0);

    return sum / this.orders.length;
  }

  /**
   * Общее количество крипты сохранненых стоп-лосс ордеров
   */
  get amountQuantity(): number {
    return this.orders.reduce((prev, value) => {
      return prev + Number(value.quantity);
    }, 0);
  }

  /**
   * Получение всех сохраненных стоп-лосс ордеров
   */
  async getStoredOrders(): Promise<void> {
    this.orders = await prisma.stopLossOrder.findMany();
  }

  /**
   * Сохранить ордер в таблицу
   * @param price Цена
   * @param quantity Количество
   */
  async save(price: string, quantity: string): Promise<void> {
    await prisma.stopLossOrder.create({ data: { price, quantity } });
    this.orders.push({ price, quantity });
  }

  /**
   * Удаление всех ордеров из таблицы
   */
  async clear(): Promise<void> {
    await prisma.stopLossOrder.deleteMany();
    this.orders = [];
  }
}
