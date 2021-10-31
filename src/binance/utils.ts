/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
import crypto from 'crypto';

const makeQueryString = (q: any): string =>
  q
    ? `?${Object.keys(q)
        .filter((k) => q[k])
        .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(q[k])}`)
        .join('&')}`
    : '';

export const getSignature = (data: any): string => {
  return crypto
    .createHmac('sha256', process.env.BINANCE_SECRET_KEY as string)
    .update(makeQueryString(data).substr(1))
    .digest('hex');
};
