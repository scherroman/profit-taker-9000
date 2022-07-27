import util from 'util'
import { differenceInDays, intervalToDuration, formatDuration } from 'date-fns'

import { humanizeNumber, humanizeDate } from 'utilities'
import { Exchange, Trade, TradeType } from 'exchange'
import { Coin, HistoricalPrice, PriceHistory } from 'coin'

export interface BacktestInput {
    coinAmount: number
    cashAmount: number
    exchange: Exchange
    startDate?: Date
    endDate?: Date
    priceHistory?: PriceHistory | HistoricalPrice[]
}

/**
 * Results of a strategy backtest
 */
export class BacktestResults {
    coin: Coin
    startingCoinAmount: number
    startingCashAmount: number
    endingCoinAmount: number
    endingCashAmount: number
    trades: Trade[]
    priceHistory: PriceHistory
    exchange: Exchange

    /**
     * @param coin - Coin used
     * @param startingCoinAmount - Initial coin amount
     * @param startingCashAmount - Initial cash amount
     * @param endingCoinAmount - Final coin amount
     * @param endingCashAmount - Final cash amount
     * @param trades - Trades made
     * @param priceHistory - Price history over which trading was performed
     * @param exchange - Exchange on which trading was performed
     */
    constructor({
        coin,
        startingCoinAmount,
        startingCashAmount,
        endingCoinAmount,
        endingCashAmount,
        priceHistory,
        exchange,
        trades
    }: {
        coin: Coin
        startingCoinAmount: number
        startingCashAmount: number
        endingCoinAmount?: number
        endingCashAmount?: number
        priceHistory: PriceHistory
        exchange: Exchange
        trades?: Trade[]
    }) {
        this.coin = coin
        this.startingCoinAmount = startingCoinAmount
        this.startingCashAmount = startingCashAmount
        this.priceHistory = priceHistory
        this.exchange = exchange
        this.endingCoinAmount = endingCoinAmount
            ? endingCoinAmount
            : startingCoinAmount
        this.endingCashAmount = endingCashAmount
            ? endingCashAmount
            : startingCashAmount
        this.trades = trades ? trades : []
    }

    get profit(): number {
        return this.endingValue - this.startingValue
    }

    get percentageYieldFraction(): number {
        return this.profit / this.startingValue
    }

    get percentageYield(): number {
        return this.percentageYieldFraction * 100
    }

    get multiplier(): number {
        return 1.0 + this.percentageYieldFraction
    }

    get isProfitable(): boolean {
        return this.profit > 0
    }

    get startingValue(): number {
        return (
            this.startingCashAmount +
            this.startingCoinAmount * this.priceHistory.startingPrice
        )
    }

    get endingValue(): number {
        return (
            this.endingCashAmount +
            this.endingCoinAmount * this.priceHistory.endingPrice
        )
    }

    get buys(): Trade[] {
        return this.trades.filter((trade) => trade.type === TradeType.Buy)
    }

    get sells(): Trade[] {
        return this.trades.filter((trade) => trade.type === TradeType.Sell)
    }

    get daysTraded(): number {
        return differenceInDays(
            this.priceHistory.endDate,
            this.priceHistory.startDate
        )
    }

    get hodlComparison(): BacktestResults {
        return new BacktestResults({
            coin: this.coin,
            startingCoinAmount: this.startingCoinAmount,
            startingCashAmount: this.startingCashAmount,
            priceHistory: this.priceHistory,
            exchange: this.exchange
        })
    }

    get buyAndHodlComparison(): BacktestResults {
        let { coin, startingCoinAmount, startingCashAmount, priceHistory } =
            this

        let { trade, newCoinAmount, newCashAmount } = this.exchange.buy({
            amount: startingCashAmount,
            historicalPrice: priceHistory.prices[0],
            initialCoinAmount: startingCoinAmount,
            initialCashAmount: startingCashAmount
        })

        return new BacktestResults({
            coin: coin,
            startingCoinAmount: newCoinAmount,
            startingCashAmount: newCashAmount,
            trades: [trade],
            priceHistory: priceHistory,
            exchange: this.exchange
        })
    }

    get #comparisonToHodling(): string {
        let comparison = 'the same as'

        if (this.endingValue > this.hodlComparison.endingValue) {
            comparison = 'better than'
        } else if (this.endingValue < this.hodlComparison.endingValue) {
            comparison = 'worse than'
        }

        return comparison
    }

    get #comparisonToBuyingAndHodling(): string {
        let comparison = 'the same as'

        if (this.endingValue > this.buyAndHodlComparison.endingValue) {
            comparison = 'better than'
        } else if (this.endingValue < this.buyAndHodlComparison.endingValue) {
            comparison = 'worse than'
        }

        return comparison
    }

    get description(): string {
        let description = this.summary
        description += `\n\n${this.numbersDescription}`
        description += `\n\nTrades: ${util.inspect(
            this.trades,
            false,
            null,
            true
        )}`

        return description
    }

    get summary(): string {
        let summary = `This strategy made a profit of $${humanizeNumber(
            this.profit
        )}, with a yield of ${humanizeNumber(
            this.percentageYield
        )}%. That's a ${humanizeNumber(this.multiplier)}x!`

        summary = `${summary}\nThis was ${
            this.#comparisonToHodling
        } simply hodling, which would have made a profit of $${humanizeNumber(
            this.hodlComparison.profit
        )} / ${humanizeNumber(
            this.hodlComparison.percentageYield
        )}% / ${humanizeNumber(this.hodlComparison.multiplier)}x.`

        summary = `${summary}\nThis was ${
            this.#comparisonToBuyingAndHodling
        } simply buying and hodling, which would have made a profit of $${humanizeNumber(
            this.buyAndHodlComparison.profit
        )} / ${humanizeNumber(
            this.buyAndHodlComparison.percentageYield
        )}% / ${humanizeNumber(this.buyAndHodlComparison.multiplier)}x.`

        return summary
    }

    get numbersDescription(): string {
        let description = `Profit: $${humanizeNumber(
            this.profit
        )} / ${humanizeNumber(this.percentageYield)}% / ${humanizeNumber(
            this.multiplier
        )}x`

        description += `\n Value: $${humanizeNumber(
            this.startingValue
        )} -> $${humanizeNumber(this.endingValue)}`

        description += `\nAmount: ${this.startingCoinAmount} ${
            this.coin.symbol
        } / $${humanizeNumber(this.startingCashAmount)} -> ${humanizeNumber(
            this.endingCoinAmount,
            8
        )} ${this.coin.symbol} / $${humanizeNumber(this.endingCashAmount)}`

        description += `\n Price: $${humanizeNumber(
            this.priceHistory.startingPrice
        )}/${this.coin.symbol} -> $${humanizeNumber(
            this.priceHistory.endingPrice
        )}/${this.coin.symbol}`

        description += `\nTrades: ${this.trades.length} trades (${
            this.buys.length
        } ${this.buys.length === 1 ? 'buy' : 'buys'}, ${this.sells.length} ${
            this.sells.length === 1 ? 'sell' : 'sells'
        })`

        description += `\n  Time: ${formatDuration(
            intervalToDuration({
                start: this.priceHistory.startDate,
                end: this.priceHistory.endDate
            }),
            { format: ['years', 'months', 'days'], delimiter: ', ' }
        )} (${humanizeDate(this.priceHistory.startDate)} to ${humanizeDate(
            this.priceHistory.endDate
        )})`

        return description
    }
}
