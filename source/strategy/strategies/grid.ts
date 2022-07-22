import { Exchange, Trade } from 'exchange'
import { Coin, HistoricalPrice } from 'coin'
import { Strategy, Parameter, SymbolPosition } from 'strategy'
import { round } from 'utilities'

const PARAMETERS = {
    buyThreshold: {
        name: 'buyThreshold',
        minimum: 0,
        maximum: 100,
        symbol: { symbol: '%', position: SymbolPosition.Suffix }
    },
    sellThreshold: {
        name: 'sellThreshold',
        minimum: 0,
        symbol: { symbol: '%', position: SymbolPosition.Suffix }
    },
    buyPercentage: {
        name: 'buyPercentage',
        minimum: 0,
        maximum: 100,
        symbol: { symbol: '%', position: SymbolPosition.Suffix }
    },
    sellPercentage: {
        name: 'sellPercentage',
        minimum: 0,
        maximum: 100,
        symbol: { symbol: '%', position: SymbolPosition.Suffix }
    }
}

export interface GridStrategyParameters {
    coin: Coin
    buyThreshold: number
    sellThreshold: number
    buyPercentage: number
    sellPercentage: number
    hasPaperHands?: boolean
}

/**
 * A strategy for making a series of trades based on percentage changes in price
 */
export abstract class GridStrategy extends Strategy {
    buyThreshold: number
    sellThreshold: number
    buyPercentage: number
    sellPercentage: number
    hasPaperHands: boolean
    parameters: Parameter[] = [
        PARAMETERS.buyThreshold,
        PARAMETERS.sellThreshold,
        PARAMETERS.buyPercentage,
        PARAMETERS.sellPercentage
    ]

    /**
     * @param coin - Coin to use
     * @param buyThreshold - Percentage drop in coin price that should trigger a buy
     * @param sellThreshold - Percentage rise in coin price that should trigger a sell
     * @param buyPercentage - Percentage of the currently held coin or cash that should be bought when the threshold is met
     * @param sellPercentage - Percentage of the currently held coin or cash that should be sold when the threshold is met
     * @param hasPaperHands - Reverses the strategy to buy high and sell low like a paper-handed fool
     */
    constructor({
        coin,
        buyThreshold,
        sellThreshold,
        buyPercentage,
        sellPercentage,
        hasPaperHands = false
    }: GridStrategyParameters) {
        super({ coin })

        this.validateParameter(buyThreshold, PARAMETERS.buyThreshold)
        this.validateParameter(sellThreshold, PARAMETERS.sellThreshold)
        this.validateParameter(buyPercentage, PARAMETERS.buyPercentage)
        this.validateParameter(sellPercentage, PARAMETERS.sellPercentage)

        this.buyThreshold = buyThreshold
        this.sellThreshold = sellThreshold
        this.buyPercentage = buyPercentage
        this.sellPercentage = sellPercentage
        this.hasPaperHands = hasPaperHands
    }

    protected get buyThresholdFraction(): number {
        return this.buyThreshold / 100
    }

    protected get sellThresholdFraction(): number {
        return this.sellThreshold / 100
    }

    protected get buyThresholdMultiple(): number {
        return 1 - this.buyThresholdFraction
    }

    protected get sellThresholdMultiple(): number {
        return 1 + this.sellThresholdFraction
    }

    protected get buyPercentageFraction(): number {
        return this.buyPercentage / 100
    }

    protected get sellPercentageFraction(): number {
        return this.sellPercentage / 100
    }

    protected getBuyPrice(referencePrice: number): number {
        return round(referencePrice * this.buyThresholdMultiple, 2)
    }

    protected getSellPrice(referencePrice: number): number {
        return round(referencePrice * this.sellThresholdMultiple, 2)
    }

    protected getTrade({
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
                amount: this.buyPercentageFraction * cashAmount,
                historicalPrice: historicalPrice,
                initialCoinAmount: coinAmount,
                initialCashAmount: cashAmount
            }))
        } else if (shouldSell) {
            ;({ trade, newCoinAmount, newCashAmount } = exchange.sell({
                amount: this.sellPercentageFraction * coinAmount,
                historicalPrice: historicalPrice,
                initialCoinAmount: coinAmount,
                initialCashAmount: cashAmount
            }))
        }

        return { trade, newCoinAmount, newCashAmount }
    }
}
