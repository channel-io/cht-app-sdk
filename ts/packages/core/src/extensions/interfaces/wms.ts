import type { Context } from "../../types/context.js";
import type {
  CancelWmsOrderInput,
  ChangeWmsShippingAddressInput,
  ExchangeWmsOrderInput,
  GetWmsOrderInput,
  GetWmsOrderOutput,
  GetWmsOrdersInput,
  GetWmsOrdersOutput,
  GetWmsShopIdInput,
  GetWmsShopIdOutput,
  GetWmsSupportedCommercesInput,
  GetWmsSupportedCommercesOutput,
  RestoreWmsOrderInput,
  ReturnWmsOrderInput,
  WmsSuccessOutput,
} from "../wms.js";
export type {
  CancelWmsOrderInput,
  ChangeWmsShippingAddressInput,
  ExchangeWmsOrderInput,
  GetWmsOrderInput,
  GetWmsOrderOutput,
  GetWmsOrdersInput,
  GetWmsOrdersOutput,
  GetWmsShopIdInput,
  GetWmsShopIdOutput,
  GetWmsSupportedCommercesInput,
  GetWmsSupportedCommercesOutput,
  RestoreWmsOrderInput,
  ReturnWmsOrderInput,
  WmsSuccessOutput,
} from "../wms.js";

// Function input/output types live with the shared Zod schemas in ../wms.js and
// are re-exported here for existing interface imports.

// =====================================================
// WMS Extension Interface
// =====================================================

/**
 * WMS Extension Interface
 *
 * Implement this interface to create a warehouse/order management extension
 * for providers such as EzAdmin and similar WMS systems.
 *
 * @example
 * ```typescript
 * @Extension({ name: "wms", systemVersion: "v1" })
 * export class MyWmsExtension implements WmsExtensionInterface {
 *   @Func("extension.wms.core.getOrders")
 *   async getOrders(ctx, params) { ... }
 * }
 * ```
 */
export interface WmsExtensionInterface {
  // --- metadata ---

  getSupportedCommerces?(
    ctx: Context,
    params: GetWmsSupportedCommercesInput
  ): Promise<GetWmsSupportedCommercesOutput>;

  // --- core ---

  getOrders(ctx: Context, params: GetWmsOrdersInput): Promise<GetWmsOrdersOutput>;

  getOrder?(ctx: Context, params: GetWmsOrderInput): Promise<GetWmsOrderOutput>;

  getShopId?(ctx: Context, params: GetWmsShopIdInput): Promise<GetWmsShopIdOutput>;

  // --- cancel ---

  cancelOrder?(ctx: Context, params: CancelWmsOrderInput): Promise<WmsSuccessOutput>;

  restoreCanceledOrder?(ctx: Context, params: RestoreWmsOrderInput): Promise<WmsSuccessOutput>;

  // --- return ---

  returnOrder?(ctx: Context, params: ReturnWmsOrderInput): Promise<WmsSuccessOutput>;

  restoreReturnedOrder?(ctx: Context, params: RestoreWmsOrderInput): Promise<WmsSuccessOutput>;

  // --- exchange ---

  exchangeOrder?(ctx: Context, params: ExchangeWmsOrderInput): Promise<WmsSuccessOutput>;

  restoreExchangedOrder?(ctx: Context, params: RestoreWmsOrderInput): Promise<WmsSuccessOutput>;

  // --- edit ---

  changeShippingAddress?(
    ctx: Context,
    params: ChangeWmsShippingAddressInput
  ): Promise<WmsSuccessOutput>;
}

/**
 * WMS Extension Function Names
 */
export const WmsFunctionNames = {
  getSupportedCommerces: "extension.wms.metadata.getSupportedCommerces",
  getOrders: "extension.wms.core.getOrders",
  getOrder: "extension.wms.core.getOrder",
  getShopId: "extension.wms.core.getShopId",
  cancelOrder: "extension.wms.cancel.cancelOrder",
  restoreCanceledOrder: "extension.wms.cancel.restoreOrder",
  returnOrder: "extension.wms.return.returnOrder",
  restoreReturnedOrder: "extension.wms.return.restoreOrder",
  exchangeOrder: "extension.wms.exchange.exchangeOrder",
  restoreExchangedOrder: "extension.wms.exchange.restoreOrder",
  changeShippingAddress: "extension.wms.edit.changeShippingAddress",
} as const;
