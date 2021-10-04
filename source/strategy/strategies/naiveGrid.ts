import { Exchange, Trade } from 'exchange'
import { Coin, HistoricalPrice, PriceHistory } from 'coin'
import { Strategy, Parameter, SymbolPosition } from 'strategy'
import { round } from 'utilities'

/**
 * A strategy that simply trades whenever the price of a coin changes by a certain percentage
 * It's naive because it can end up buying all the way down and selling lower when the price goes up just a little
 */
export class NaiveGridStrategy extends Strategy {
    buyThreshold: number
    sellThreshold: number
    tradePercentage: number
    hasPaperHands: boolean
    parameters: Parameter[] = [
        {
            name: 'buyThreshold',
            minimum: 0,
            maximum: 100,
            symbol: { symbol: '%', position: SymbolPosition.Suffix }
        },
        {
            name: 'sellThreshold',
            minimum: 0,
            symbol: { symbol: '%', position: SymbolPosition.Suffix }
        },
        {
            name: 'tradePercentage',
            minimum: 0,
            maximum: 100,
            symbol: { symbol: '%', position: SymbolPosition.Suffix }
        }
    ]

    /**
     * @param coin - Coin to use
     * @param buyThreshold - Percentage drop in coin price that should trigger a buy
     * @param sellThreshold - Percentage rise in coin price that should trigger a sell
     * @param tradePercentage - Percentage of the currently held coin or cash that should be traded
     * @param hasPaperHands - Reverses the strategy to buy high and sell low like a paper-handed fool
     */
    constructor({
        coin,
        buyThreshold,
        sellThreshold,
        tradePercentage,
        hasPaperHands = false
    }: {
        coin: Coin
        buyThreshold: number
        sellThreshold: number
        tradePercentage: number
        hasPaperHands?: boolean
    }) {
        super({ coin })

        if (tradePercentage > 100) {
            throw new Error(
                `Invalid trade percentage ${tradePercentage}. Trade percentage must be between 0 and 100`
            )
        }

        this.buyThreshold = buyThreshold
        this.sellThreshold = sellThreshold
        this.tradePercentage = tradePercentage
        this.hasPaperHands = hasPaperHands
    }

    get #buyThresholdFraction(): number {
        return this.buyThreshold / 100
    }

    get #sellThresholdFraction(): number {
        return this.sellThreshold / 100
    }

    get #buyThresholdMultiple(): number {
        return 1 - this.#buyThresholdFraction
    }

    get #sellThresholdMultiple(): number {
        return 1 + this.#sellThresholdFraction
    }

    get #tradePercentageFraction(): number {
        return this.tradePercentage / 100
    }

    #getBuyPrice(referencePrice: number): number {
        return round(referencePrice * this.#buyThresholdMultiple, 2)
    }

    #getSellPrice(referencePrice: number): number {
        return round(referencePrice * this.#sellThresholdMultiple, 2)
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
        let buyPrice = this.#getBuyPrice(referencePrice)
        let sellPrice = this.#getSellPrice(referencePrice)

        for (let historicalPrice of priceHistory.prices) {
            let { trade, newCoinAmount, newCashAmount } = this.#getTrade({
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
                buyPrice = this.#getBuyPrice(referencePrice)
                sellPrice = this.#getSellPrice(referencePrice)
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
        buyPrice,
        sellPrice,
        coinAmount,
        cashAmount,
        exchange
    }: {
        historicalPrice: HistoricalPrice
        buyPrice: number
        sellPrice: number
        coinAmount: number
        cashAmount: number
        exchange: Exchange
    }): { trade?: Trade; newCoinAmount: number; newCashAmount: number } {
        let trade
        let newCoinAmount = coinAmount
        let newCashAmount = cashAmount
        let { price } = historicalPrice

        let shouldBuy, shouldSell
        if (!this.hasPaperHands) {
            // Buy low, sell high
            shouldBuy = price <= buyPrice && cashAmount !== 0
            shouldSell = price >= sellPrice && coinAmount !== 0
        } else {
            // Buy high, sell low
            shouldBuy = price >= sellPrice && cashAmount !== 0
            shouldSell = price <= buyPrice && coinAmount !== 0
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
