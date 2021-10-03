import { HistoricalPrice } from 'coin'

/**
 * A cryptocurrency exchange where cryptocurrencies are bought and sold
 */
export class Exchange {
    name: string
    tradingFeePercentage: number

    constructor({
        name,
        tradingFeePercentage
    }: {
        name: string
        tradingFeePercentage: number
    }) {
        this.name = name
        this.tradingFeePercentage = tradingFeePercentage
    }

    get tradingFeePercentageFraction(): number {
        return this.tradingFeePercentage / 100
    }

    /**
     * Buy a coin
     * @param amount - Amount of cash to spend
     * @param historicalPrice - Price at the time of buying
     * @param initialCoinAmount - Coin amount before buying
     * @param initialCashAmount - Cash amount before buying
     * @returns Trade object, new coin amount, and new cash amount
     */
    buy({
        amount,
        historicalPrice,
        initialCoinAmount,
        initialCashAmount
    }: TradeInput): TradeOutput {
        let { price, date } = historicalPrice
        let fee = amount * this.tradingFeePercentageFraction
        if (amount + fee >= initialCashAmount) {
            // Ensure we have enough to pay for the fee
            amount -= fee
            fee = amount * this.tradingFeePercentageFraction
        }
        let coinsPurchased = amount / price

        return {
            trade: {
                type: TradeType.Buy,
                amount: coinsPurchased,
                price,
                date
            },
            newCoinAmount: initialCoinAmount + coinsPurchased,
            newCashAmount: initialCashAmount - (amount + fee)
        }
    }

    /**
     * Sell a coin
     * @param amount - Amount of coins to sell
     * @param historicalPrice - Price at the time of selling
     * @param initialCoinAmount - Coin amount before selling
     * @param initialCashAmount - Cash amount before selling
     * @returns Trade object, new coin amount, and new cash amount
     */
    sell({
        amount,
        historicalPrice,
        initialCoinAmount,
        initialCashAmount
    }: TradeInput): TradeOutput {
        let { price, date } = historicalPrice
        let cashReceived = amount * price
        let fee = cashReceived * this.tradingFeePercentageFraction

        return {
            trade: {
                type: TradeType.Sell,
                amount,
                price,
                date
            },
            newCoinAmount: initialCoinAmount - amount,
            newCashAmount: initialCashAmount + (cashReceived - fee)
        }
    }
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

interface TradeInput {
    amount: number
    historicalPrice: HistoricalPrice
    initialCoinAmount: number
    initialCashAmount: number
}

interface TradeOutput {
    trade: Trade
    newCoinAmount: number
    newCashAmount: number
}

export const EXCHANGES: Record<string, Exchange> = {
    free: new Exchange({ name: 'Free', tradingFeePercentage: 0 }),
    coinbasePro: new Exchange({
        name: 'Coinbase Pro',
        tradingFeePercentage: 0.5
    })
}
