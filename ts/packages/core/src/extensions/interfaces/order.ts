import type { Context } from "../../types/context.js";
import type {
  OrderCancelOrderInput as ProtoCancelOrderInput,
  OrderChangeShippingAddressInput as ProtoChangeShippingAddressInput,
  OrderClaimItem as ProtoClaimItem,
  OrderExchangeItem as ProtoExchangeItem,
  OrderExchangeOrderInput as ProtoExchangeOrderInput,
  OrderGetAppConfigsInput as ProtoGetAppConfigsInput,
  OrderGetAppConfigsOutput as ProtoGetAppConfigsOutput,
  OrderGetExchangeableItemsInput as ProtoGetExchangeableItemsInput,
  OrderGetExchangeableItemsOutput as ProtoGetExchangeableItemsOutput,
  OrderGetOrdersInput as ProtoGetOrdersInput,
  OrderGetOrdersOutput as ProtoGetOrdersOutput,
  OrderReturnOrderInput as ProtoReturnOrderInput,
  OrderSuccessOutput as ProtoSuccessOutput,
} from "../../gen/channel/app/sdk/v1/extension.js";

// =====================================================
// Function Input/Output Types
// =====================================================

// --- core ---

export type GetOrdersInput = ProtoGetOrdersInput;
export type GetOrdersOutput = ProtoGetOrdersOutput;
export type GetAppConfigsInput = ProtoGetAppConfigsInput;
export type GetAppConfigsOutput = ProtoGetAppConfigsOutput;

// --- shared claim item type ---

export type ClaimItem = ProtoClaimItem;

// --- cancel ---

export type CancelOrderInput = ProtoCancelOrderInput;

// --- return ---

export type ReturnOrderInput = ProtoReturnOrderInput;

// --- exchange ---

export type ExchangeItem = ProtoExchangeItem;
export type ExchangeOrderInput = ProtoExchangeOrderInput;
export type GetExchangeableItemsInput = ProtoGetExchangeableItemsInput;
export type GetExchangeableItemsOutput = ProtoGetExchangeableItemsOutput;

// --- edit ---

export type ChangeShippingAddressInput = ProtoChangeShippingAddressInput;
export type SuccessOutput = ProtoSuccessOutput;

// =====================================================
// Order Extension Interface
// =====================================================

/**
 * Order Extension Interface
 *
 * Implement this interface to create an order management extension
 * for commerce platforms (e.g., Naver Smart Store, Cafe24, Shopify).
 *
 * @example
 * ```typescript
 * @Extension({ name: "order", systemVersion: "v1" })
 * export class MyOrderExtension implements OrderExtensionInterface {
 *   @Func("extension.order.core.getOrders")
 *   async getOrders(ctx, params) { ... }
 *
 *   @Func("extension.order.core.getAppConfigs")
 *   async getAppConfigs(ctx) { ... }
 * }
 * ```
 */
export interface OrderExtensionInterface {
  // --- core (required) ---

  getOrders(ctx: Context, params: GetOrdersInput): Promise<GetOrdersOutput>;

  getAppConfigs(ctx: Context, params: GetAppConfigsInput): Promise<GetAppConfigsOutput>;

  // --- cancel (optional) ---

  cancelOrder?(ctx: Context, params: CancelOrderInput): Promise<SuccessOutput>;

  // --- return (optional) ---

  returnOrder?(ctx: Context, params: ReturnOrderInput): Promise<SuccessOutput>;

  // --- exchange (optional) ---

  exchangeOrder?(ctx: Context, params: ExchangeOrderInput): Promise<SuccessOutput>;

  getExchangeableItems?(
    ctx: Context,
    params: GetExchangeableItemsInput
  ): Promise<GetExchangeableItemsOutput>;

  // --- edit (optional) ---

  changeShippingAddress?(ctx: Context, params: ChangeShippingAddressInput): Promise<SuccessOutput>;
}

/**
 * Order Extension Function Names
 */
export const OrderFunctionNames = {
  getOrders: "extension.order.core.getOrders",
  getAppConfigs: "extension.order.core.getAppConfigs",
  cancelOrder: "extension.order.cancel.cancelOrder",
  returnOrder: "extension.order.return.returnOrder",
  exchangeOrder: "extension.order.exchange.exchangeOrder",
  getExchangeableItems: "extension.order.exchange.getExchangeableItems",
  changeShippingAddress: "extension.order.edit.changeShippingAddress",
} as const;
