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

    get percentageYield(): number {
        return this.profit / this.startingValue
    }

    get displayYield(): number {
        return this.percentageYield * 100
    }

    get multiplier(): number {
        return 1.0 + this.percentageYield
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

    get summary(): string {
        let summary = `This strategy made a profit of $${humanizeNumber(
            this.profit
        )}, with a yield of ${humanizeNumber(
            this.displayYield
        )}%. That's a ${humanizeNumber(this.multiplier)}x!`

        summary = `${summary}\nThis was ${
            this.#comparisonToHodling
        } simply hodling, which would have made a profit of $${humanizeNumber(
            this.hodlComparison.profit
        )} / ${humanizeNumber(
            this.hodlComparison.displayYield
        )}% / ${humanizeNumber(this.hodlComparison.multiplier)}x.`

        summary = `${summary}\nThis was ${
            this.#comparisonToBuyingAndHodling
        } simply buying and hodling, which would have made a profit of $${humanizeNumber(
            this.buyAndHodlComparison.profit
        )} / ${humanizeNumber(
            this.buyAndHodlComparison.displayYield
        )}% / ${humanizeNumber(this.buyAndHodlComparison.multiplier)}x.`

        return summary
    }

    get description(): string {
        return `
        Profit: $${humanizeNumber(this.profit)} / ${humanizeNumber(
            this.displayYield
        )}% / ${humanizeNumber(this.multiplier)}x
        Value: $${humanizeNumber(this.startingValue)} -> $${humanizeNumber(
            this.endingValue
        )}
        Amount: ${this.startingCoinAmount} ${
            this.coin.symbol
        } / $${humanizeNumber(this.startingCashAmount)} -> ${humanizeNumber(
            this.endingCoinAmount,
            8
        )} ${this.coin.symbol} / $${humanizeNumber(this.endingCashAmount)}
        Price: $${humanizeNumber(this.priceHistory.startingPrice)}/${
            this.coin.symbol
        } -> $${humanizeNumber(this.priceHistory.endingPrice)}/${
            this.coin.symbol
        }
        Time: Traded ${this.trades.length} times (${this.buys.length} buys, ${
            this.sells.length
        } sells) over ${formatDuration(
            intervalToDuration({
                start: this.priceHistory.startDate,
                end: this.priceHistory.endDate
            }),
            { delimiter: ', ' }
        )} from ${humanizeDate(this.priceHistory.startDate)} to ${humanizeDate(
            this.priceHistory.endDate
        )}
        `
    }
}
