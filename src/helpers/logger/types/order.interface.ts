type Side = 'BUY' | 'SELL';

interface Order {
  time: number;
  side: Side;
  price: string;
  quantity: string;
  usd: string;
  isProfit: boolean;
}

export default Order;
