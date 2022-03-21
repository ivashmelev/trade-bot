export const precision = (value: number) => {
  const indexDot = 2;
  const possiblePrecision = 6;
  const quantityArr = Array.from(String(value));
  const indexGreaterNull = quantityArr.findIndex((value) => Number(value) > 0);

  return Number(value.toPrecision(possiblePrecision - (indexGreaterNull - indexDot)));
};
