import hash from 'hash.js';
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
    .createHmac('sha256', process.env.BINANCE_SECRET_KEY!)
    .update(makeQueryString(data).substr(1))
    .digest('hex');
};
