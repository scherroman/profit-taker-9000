import { Exchange, Trade } from 'exchange'
import { Coin, PriceHistory } from 'coin'
import { Strategy, Parameter } from '../'

/**
 * A strategy that simply buys and then hodls through rain or shine
 */
export class BuyAndHodlStrategy extends Strategy {
    /**
     * @param coin - Coin to use
     */
    constructor({ coin }: { coin: Coin }) {
        super({ coin })
    }

    get parameters(): Parameter[] {
        return []
    }

    protected getTrades({
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
        let { trade, newCoinAmount, newCashAmount } = exchange.buy({
            amount: cashAmount,
            historicalPrice: priceHistory.prices[0],
            initialCoinAmount: coinAmount,
            initialCashAmount: cashAmount
        })

        return {
            trades: [trade],
            endingCoinAmount: newCoinAmount,
            endingCashAmount: newCashAmount
        }
    }
}
