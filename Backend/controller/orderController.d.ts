import type { Request, Response } from "express";
/** POST /api/orders — creates a Cash on Delivery order. Prices are read from MongoDB, not trusted from the browser. */
export declare function createOrder(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function getOrderById(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=orderController.d.ts.map