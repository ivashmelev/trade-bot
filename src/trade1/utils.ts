export const calcValueByPercentage = (value: number, percentage: number): number => {
  return value + value * (percentage / 100);
};

export const setIntervalAsync = async (callback: () => Promise<void>, ms: number): Promise<void> => {
  await callback();
  setTimeout(() => setIntervalAsync(callback, ms), ms);
};
