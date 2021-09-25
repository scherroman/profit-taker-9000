import { Trade, TradeType } from 'exchange'
import { Coin, HistoricalPrice, PriceHistory } from 'coin'
import { Strategy } from 'strategy'
import { round } from 'utilities'

/**
 * A naive grid strategy that trades whenever the price of the coin changes by a certain percentage
 */
export class NaiveGridStrategy extends Strategy {
    triggerThreshold: number
    tradePercentage: number

    /**
     * @param coin - Coin to use
     * @param triggerThreshold - Percentage change in coin price that should trigger a trade
     * @param tradePercentage - Percentage of the currently held coin or cash that should be traded
     */
    constructor({
        coin,
        triggerThreshold,
        tradePercentage
    }: {
        coin: Coin
        triggerThreshold: number
        tradePercentage: number
    }) {
        super({ coin })
        this.triggerThreshold = triggerThreshold
        this.tradePercentage = tradePercentage
    }

    get #triggerThresholdFraction(): number {
        return this.triggerThreshold / 100
    }

    get #tradePercentageFraction(): number {
        return this.tradePercentage / 100
    }

    protected getTrades({
        priceHistory,
        coinAmount,
        cashAmount,
        tradingFeePercentage
    }: {
        priceHistory: PriceHistory
        coinAmount: number
        cashAmount: number
        tradingFeePercentage: number
    }): {
        trades: Trade[]
        endingCoinAmount: number
        endingCashAmount: number
    } {
        let trades = []
        let referencePrice = priceHistory.startingPrice

        for (let historicalPrice of priceHistory.prices) {
            let { trade, newCoinAmount, newCashAmount } = this.#getTrade({
                historicalPrice,
                referencePrice,
                coinAmount,
                cashAmount,
                tradingFeePercentage
            })
            if (trade) {
                trades.push(trade)
                referencePrice = trade.price
                coinAmount = newCoinAmount
                cashAmount = newCashAmount
            }
        }

        return {
            trades,
            endingCoinAmount: coinAmount,
            endingCashAmount: cashAmount
        }
    }

    #getTrade({
        historicalPrice,
        referencePrice,
        coinAmount,
        cashAmount,
        tradingFeePercentage
    }: {
        historicalPrice: HistoricalPrice
        referencePrice: number
        coinAmount: number
        cashAmount: number
        tradingFeePercentage: number
    }): { trade?: Trade; newCoinAmount: number; newCashAmount: number } {
        let trade
        let price = historicalPrice.price
        let date = historicalPrice.date
        let tradingFeePercentageFraction = tradingFeePercentage / 100
        let multiple = 1 + this.#triggerThresholdFraction
        let buyPrice = round(
            this.#triggerThresholdFraction < 1
                ? referencePrice * (1 - this.#triggerThresholdFraction)
                : referencePrice / multiple,
            2
        )
        let sellPrice = round(referencePrice * multiple, 2)
        let shouldBuy = price <= buyPrice && cashAmount !== 0
        let shouldSell = price >= sellPrice && coinAmount !== 0

        if (shouldBuy || shouldSell) {
            if (shouldBuy) {
                let cashSpent = this.#tradePercentageFraction * cashAmount
                let fee = cashSpent * tradingFeePercentageFraction
                if (cashSpent + fee > cashAmount) {
                    // Ensure we have enough to pay for the fee
                    cashSpent -= fee
                    fee = cashSpent * tradingFeePercentageFraction
                }
                let coinsPurchased = cashSpent / price
                trade = {
                    type: TradeType.Buy,
                    amount: coinsPurchased,
                    price: price,
                    date: date
                }
                coinAmount += coinsPurchased
                cashAmount -= cashSpent + fee
            } else {
                let coinsSold = this.#tradePercentageFraction * coinAmount
                let cashReceived = coinsSold * price
                let fee = cashReceived * tradingFeePercentageFraction
                trade = {
                    type: TradeType.Sell,
                    amount: coinsSold,
                    price: price,
                    date: date
                }
                coinAmount -= coinsSold
                cashAmount += cashReceived - fee
            }
        }

        return { trade, newCoinAmount: coinAmount, newCashAmount: cashAmount }
    }
}
