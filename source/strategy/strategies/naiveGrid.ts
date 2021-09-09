import { Trade, TradeType } from 'exchange'
import { Coin, HistoricalPrice, PriceHistory } from 'coin'
import { Strategy } from 'strategy'

/**
 * A naive grid strategy that trades whenever the price of the coin changes by a certain percentage
 */
export class NaiveGridStrategy extends Strategy {
    triggerPercentage: number
    tradePercentage: number

    /**
     * @param coin - Coin to use
     * @param triggerPercentage - Percentage change in coin price that should trigger a trade
     * @param tradePercentage - Percentage of the currently held coin or cash that should be traded
     */
    constructor({
        coin,
        triggerPercentage,
        tradePercentage
    }: {
        coin: Coin
        triggerPercentage: number
        tradePercentage: number
    }) {
        super({ coin })
        this.triggerPercentage = triggerPercentage
        this.tradePercentage = tradePercentage
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
        let priceStep = referencePrice * this.triggerPercentage
        let shouldBuy = price < referencePrice - priceStep && cashAmount !== 0
        let shouldSell = price > referencePrice + priceStep && coinAmount !== 0

        if (shouldBuy || shouldSell) {
            if (shouldBuy) {
                let cashSpent = this.tradePercentage * cashAmount
                let coinsPurchased = cashSpent / price
                let fee = cashSpent * tradingFeePercentage
                trade = {
                    type: TradeType.Buy,
                    amount: coinsPurchased,
                    price: price,
                    date: date
                }
                coinAmount += coinsPurchased
                cashAmount -= cashSpent + fee
            } else {
                let coinsSold = this.tradePercentage * coinAmount
                let cashReceived = coinsSold * price
                let fee = cashReceived * tradingFeePercentage
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
