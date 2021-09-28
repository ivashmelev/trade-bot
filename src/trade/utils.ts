export const calcValueByPercentage = (value: number, percentage: number): number => {
  return value + value * (percentage / 100);
};
