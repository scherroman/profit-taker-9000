import { Exchange, Trade } from 'exchange'
import { Coin, PriceHistory } from 'coin'
import { Grid } from 'strategy/strategies/grid'

/**
 * A strategy that simply trades whenever the price of a coin changes by a certain percentage
 * It's naive because it doesn't pay attention to cost basis, and can end up buying all the way down then actually selling lower when the price goes up just a little
 */
export class NaiveGridStrategy extends Grid {
    constructor({
        coin,
        buyThreshold,
        sellThreshold,
        buyPercentage,
        sellPercentage,
        hasPaperHands = false
    }: {
        coin: Coin
        buyThreshold: number
        sellThreshold: number
        buyPercentage: number
        sellPercentage: number
        hasPaperHands?: boolean
    }) {
        super({
            coin,
            buyThreshold,
            sellThreshold,
            buyPercentage,
            sellPercentage,
            hasPaperHands
        })
    }

    getTrades({
        priceHistory,
        coinAmount,
        cashAmount,
        exchange
    }: {
        priceHistory: PriceHistory
        coinAmount: number
        cashAmount: number
        exchange: Exchange
    }): {
        trades: Trade[]
        endingCoinAmount: number
        endingCashAmount: number
    } {
        let trades = []
        let referencePrice = priceHistory.startingPrice
        let buyPrice = this.getBuyPrice(referencePrice)
        let sellPrice = this.getSellPrice(referencePrice)

        for (let historicalPrice of priceHistory.prices) {
            let { trade, newCoinAmount, newCashAmount } = this.getTrade({
                historicalPrice,
                buyPrice,
                sellPrice,
                coinAmount,
                cashAmount,
                exchange
            })
            if (trade) {
                trades.push(trade)
                coinAmount = newCoinAmount
                cashAmount = newCashAmount
                referencePrice = trade.price
                buyPrice = this.getBuyPrice(referencePrice)
                sellPrice = this.getSellPrice(referencePrice)
            }
        }

        return {
            trades,
            endingCoinAmount: coinAmount,
            endingCashAmount: cashAmount
        }
    }
}
