import { Exchange, Trade } from 'exchange'
import { Coin, HistoricalPrice, PriceHistory } from 'coin'
import { Strategy, Parameter, SymbolPosition } from 'strategy'
import { round } from 'utilities'

/**
 * A strategy that trades whenever the price of the coin changes by a certain percentage
 * It's naive because it can end up buying all the way down and selling lower when the price goes up just a little
 */
export class NaiveGridStrategy extends Strategy {
    triggerThreshold: number
    tradePercentage: number
    hasPaperHands: boolean
    parameters: Parameter[] = [
        {
            name: 'triggerThreshold',
            symbol: { symbol: '%', position: SymbolPosition.Suffix }
        },
        {
            name: 'tradePercentage',
            symbol: { symbol: '%', position: SymbolPosition.Suffix }
        }
    ]

    /**
     * @param coin - Coin to use
     * @param triggerThreshold - Percentage change in coin price that should trigger a trade
     * @param tradePercentage - Percentage of the currently held coin or cash that should be traded
     * @param hasPaperHands - Reverses the strategy to buy high and sell low like a paper-handed fool
     */
    constructor({
        coin,
        triggerThreshold,
        tradePercentage,
        hasPaperHands = false
    }: {
        coin: Coin
        triggerThreshold: number
        tradePercentage: number
        hasPaperHands?: boolean
    }) {
        super({ coin })

        if (tradePercentage > 100) {
            throw new Error(
                `Invalid trade percentage ${tradePercentage}. Trade percentage must be between 0 and 100`
            )
        }

        this.triggerThreshold = triggerThreshold
        this.tradePercentage = tradePercentage
        this.hasPaperHands = hasPaperHands
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

        for (let historicalPrice of priceHistory.prices) {
            let { trade, newCoinAmount, newCashAmount } = this.#getTrade({
                historicalPrice,
                referencePrice,
                coinAmount,
                cashAmount,
                exchange
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
        exchange
    }: {
        historicalPrice: HistoricalPrice
        referencePrice: number
        coinAmount: number
        cashAmount: number
        exchange: Exchange
    }): { trade?: Trade; newCoinAmount: number; newCashAmount: number } {
        let trade
        let newCoinAmount = coinAmount
        let newCashAmount = cashAmount

        let price = historicalPrice.price
        let multiple = 1 + this.#triggerThresholdFraction

        let higherPrice = round(referencePrice * multiple, 2)
        let lowerPrice = round(
            this.#triggerThresholdFraction < 1
                ? referencePrice * (1 - this.#triggerThresholdFraction)
                : referencePrice / multiple,
            2
        )
        let buyPrice, sellPrice, shouldBuy, shouldSell
        if (!this.hasPaperHands) {
            buyPrice = lowerPrice
            sellPrice = higherPrice
            shouldBuy = price <= buyPrice && cashAmount !== 0
            shouldSell = price >= sellPrice && coinAmount !== 0
        } else {
            buyPrice = higherPrice
            sellPrice = lowerPrice
            shouldBuy = price >= buyPrice && cashAmount !== 0
            shouldSell = price <= sellPrice && coinAmount !== 0
        }

        if (shouldBuy) {
            ;({ trade, newCoinAmount, newCashAmount } = exchange.buy({
                amount: this.#tradePercentageFraction * cashAmount,
                historicalPrice: historicalPrice,
                initialCoinAmount: coinAmount,
                initialCashAmount: cashAmount
            }))
        } else if (shouldSell) {
            ;({ trade, newCoinAmount, newCashAmount } = exchange.sell({
                amount: this.#tradePercentageFraction * coinAmount,
                historicalPrice: historicalPrice,
                initialCoinAmount: coinAmount,
                initialCashAmount: cashAmount
            }))
        }

        return { trade, newCoinAmount, newCashAmount }
    }
}
