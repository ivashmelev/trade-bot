import { ExecutionReportEvent, OrderStatus } from '../../trade/types';

export type OrderStatusHandlers = Partial<Record<OrderStatus, (payload: ExecutionReportEvent) => void>>;
