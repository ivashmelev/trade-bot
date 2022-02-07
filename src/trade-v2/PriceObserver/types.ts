export interface CoincapMessage {
  exchange: string;
  base: string;
  quote: string;
  direction: string;
  price: number;
  volume: number;
  timestamp: number;
  priceUsd: number;
}
