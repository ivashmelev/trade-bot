export interface PriceEvent {
  exchange: string;
  base: 'bitcoin';
  quote: 'tether';
  direction: 'buy' | 'sell';
  price: number;
  volume: number;
  timestamp: number;
  priceUsd: number;
}
