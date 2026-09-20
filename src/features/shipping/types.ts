export interface ShippingQuoteItem {
  productId: string
  quantity: number
}

export interface ShippingQuoteRequest {
  destinationZip: string
  items: ShippingQuoteItem[]
}

export interface ShippingOption {
  serviceCode: string
  carrierName: string
  priceCents: number
  estimatedDays: number
}

export interface ShippingQuoteResult {
  options: ShippingOption[]
  freeShippingApplied: boolean
  subtotalCents: number
}

export interface ShippingQuoteVariables {
  destinationZip: string
  items: ShippingQuoteItem[]
}
