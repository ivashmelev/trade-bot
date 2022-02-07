export interface OrderRepository {
  save: (price: string, quantity: string) => Promise<void>;
  clear: () => Promise<void>;
  getStoredOrders: () => Promise<void>;
}
