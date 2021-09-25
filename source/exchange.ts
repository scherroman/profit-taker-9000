/**
 * A cryptocurrency exchange where cryptocurrencies are bought and sold
 */
export interface Exchange {
    name: string
    tradingFeePercentage: number
}

/**
 * A buy or sell event for an asset
 */
export interface Trade {
    type: TradeType
    amount: number
    price: number
    date: Date
}

export enum TradeType {
    Buy = 'Buy',
    Sell = 'Sell'
}

export const EXCHANGES: Record<string, Exchange> = {
    coinbasePro: { name: 'Coinbase Pro', tradingFeePercentage: 0.5 }
}
