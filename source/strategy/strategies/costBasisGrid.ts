import { subDays } from 'date-fns'

import { round } from 'utilities'
import { Exchange, Trade, TradeType } from 'exchange'
import { PriceHistory } from 'coin'
import { SymbolPosition } from '../'
import { GridStrategy, GridStrategyParameters } from './grid'

/**
 * A strategy that trades when the price of a coin changes by a certain percentage relative to the current cost basis.
 * Prevents undesireable repeated buying and selling after crossing a buy or sell threshold by increasing the threshold by a factor of 2 until an opposing sell or buy is made, respectively.
 */
export class CostBasisGridStrategy extends GridStrategy {
    costBasis?: number
    buyThresholdMultiplier = 1
    sellThresholdMultiplier = 1

    constructor({
        costBasis,
        ...rest
    }: GridStrategyParameters & {
        costBasis?: number
    }) {
        super(rest)

        if (costBasis) {
            this.validateParameter(costBasis, PARAMETERS.costBasis)
        }

        this.costBasis = costBasis
    }

    protected getBuyPrice(referencePrice: number): number {
        return round(
            (referencePrice * this.buyThresholdMultiple) /
                this.buyThresholdMultiplier,
            2
        )
    }

    protected getSellPrice(referencePrice: number): number {
        return round(
            referencePrice *
                this.sellThresholdMultiple *
                this.sellThresholdMultiplier,
            2
        )
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
        let costBasis = this.costBasis
            ? this.costBasis
            : priceHistory.startingPrice
        let originalBuy = {
            type: TradeType.Buy,
            amount: coinAmount,
            price: costBasis,
            date: subDays(priceHistory.startDate, 1)
        }
        let buyPrice = this.getBuyPrice(costBasis)
        let sellPrice = this.getSellPrice(costBasis)
        let previousTradeType: TradeType | null = null

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
                costBasis = this.getCostBasis(coinAmount, [
                    originalBuy,
                    ...trades
                ])

                if (
                    trade.type == TradeType.Buy &&
                    (previousTradeType === null ||
                        previousTradeType === TradeType.Buy)
                ) {
                    this.buyThresholdMultiplier *= 2
                } else if (
                    this.buyThresholdMultiplier > 1 &&
                    trade.type === TradeType.Sell
                ) {
                    // Reset buy threshold when a sell is made
                    this.buyThresholdMultiplier = 1
                }

                if (
                    trade.type == TradeType.Sell &&
                    (previousTradeType === null ||
                        previousTradeType === TradeType.Sell)
                ) {
                    this.sellThresholdMultiplier *= 2
                } else if (
                    this.sellThresholdMultiplier > 1 &&
                    trade.type === TradeType.Buy
                ) {
                    // Reset sell threshold when a buy is made
                    this.sellThresholdMultiplier = 1
                }

                buyPrice = this.getBuyPrice(costBasis)
                sellPrice = this.getSellPrice(costBasis)
                previousTradeType = trade.type
            }
        }

        return {
            trades,
            endingCoinAmount: coinAmount,
            endingCashAmount: cashAmount
        }
    }

    private getCostBasis(coinAmount: number, trades: Trade[]): number {
        let costBasis = 0
        let buys = trades.filter((trade) => trade.type === TradeType.Buy)
        let sells = trades.filter((trade) => trade.type === TradeType.Sell)
        let soldAmount = sells.reduce((sum, trade) => sum + trade.amount, 0)
        for (let buy of buys) {
            // Subtract sold coins from calculation of cost basis
            let buyAmount = buy.amount
            if (soldAmount > 0) {
                if (soldAmount > buyAmount) {
                    buyAmount = 0
                    soldAmount -= buyAmount
                } else {
                    buyAmount -= soldAmount
                    soldAmount = 0
                }
            }

            if (buyAmount > 0) {
                costBasis += (buyAmount / coinAmount) * buy.price
            }
        }

        return costBasis
    }
}

const PARAMETERS = {
    costBasis: {
        name: 'costBasis',
        minimum: 0,
        symbol: { symbol: '$', position: SymbolPosition.Suffix }
    }
}
