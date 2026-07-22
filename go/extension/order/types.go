package order

import sdkv1 "github.com/channel-io/app-sdk/go/internal/gen/channel/app/sdk/v1"

const (
	ExtensionName = "order"
	SystemVersion = "v1"

	FunctionGetOrders             = "extension.order.core.getOrders"
	FunctionGetAppConfigs         = "extension.order.core.getAppConfigs"
	FunctionCancelOrder           = "extension.order.cancel.cancelOrder"
	FunctionReturnOrder           = "extension.order.return.returnOrder"
	FunctionExchangeOrder         = "extension.order.exchange.exchangeOrder"
	FunctionGetExchangeableItems  = "extension.order.exchange.getExchangeableItems"
	FunctionChangeShippingAddress = "extension.order.edit.changeShippingAddress"
)

type Address = sdkv1.OrderAddress
type BankAccount = sdkv1.OrderBankAccount
type DefectInfo = sdkv1.OrderDefectInfo
type ClaimReason = sdkv1.OrderClaimReason
type Claimability = sdkv1.OrderClaimability
type Claim = sdkv1.OrderClaim
type OrderItem = sdkv1.OrderItem
type Item = sdkv1.OrderItem
type Payment = sdkv1.OrderPayment
type Fulfillment = sdkv1.OrderFulfillment
type Order = sdkv1.Order
type AllowedValue = sdkv1.OrderAllowedValue
type FieldConfig = sdkv1.OrderFieldConfig
type OperationOptions = sdkv1.OrderOperationOptions
type AppCapabilities = sdkv1.OrderAppCapabilities

type GetOrdersInput = sdkv1.OrderGetOrdersInput
type GetOrdersOutput = sdkv1.OrderGetOrdersOutput
type GetAppConfigsInput = sdkv1.OrderGetAppConfigsInput
type GetAppConfigsOutput = sdkv1.OrderGetAppConfigsOutput
type ClaimItem = sdkv1.OrderClaimItem
type CancelOrderInput = sdkv1.OrderCancelOrderInput
type ReturnOrderInput = sdkv1.OrderReturnOrderInput
type ExchangeItem = sdkv1.OrderExchangeItem
type ExchangeOrderInput = sdkv1.OrderExchangeOrderInput
type GetExchangeableItemsInput = sdkv1.OrderGetExchangeableItemsInput
type GetExchangeableItemsOutput = sdkv1.OrderGetExchangeableItemsOutput
type ChangeShippingAddressInput = sdkv1.OrderChangeShippingAddressInput
type SuccessOutput = sdkv1.OrderSuccessOutput
