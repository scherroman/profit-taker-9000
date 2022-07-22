import { Exchange, Trade, TradeType } from 'exchange'
import { PriceHistory } from 'coin'
import { GridStrategy } from 'strategy/strategies/grid'

/**
 * An optimistic strategy that trades when the price of a coin changes by a certain percentage relative to the last sell price.
 * It's optimistic because it continues to buy as prices fall, but waits to sell until prices rise to surpass the last sell price.
 */
export class OptimisticGridStrategy extends GridStrategy {
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
                if (trade.type === TradeType.Sell) {
                    referencePrice = trade.price
                    buyPrice = this.getBuyPrice(referencePrice)
                    sellPrice = this.getSellPrice(referencePrice)
                } else {
                    // Sell price doesn't change, wait until we surpass the last sell price
                    buyPrice = trade.price * this.buyThresholdFraction
                }
            }
        }

        return {
            trades,
            endingCoinAmount: coinAmount,
            endingCashAmount: cashAmount
        }
    }
}
