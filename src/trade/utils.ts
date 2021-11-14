import { OrderType, Side, Threshold } from './types';

export const calcValueByPercentage = (value: number, percentage: number): number => {
  return value + value * (percentage / 100);
};

export const getPrice = (
  threshold: Threshold,
  side: Side,
  type: OrderType,
  price: number,
  isLimit: boolean
): string => {
  const percentage = threshold[side][type];
  const percentageWithLimitThreshold = Math.abs(
    Math.sign(percentage) > 0 ? percentage + threshold.limit : percentage - threshold.limit
  );

  if (isLimit) {
    return calcValueByPercentage(price, percentageWithLimitThreshold).toFixed(2);
  }
  return calcValueByPercentage(price, percentage).toFixed(2);
};
