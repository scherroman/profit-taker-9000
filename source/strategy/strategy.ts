import { differenceInDays, intervalToDuration, formatDuration } from 'date-fns'
import {
    Range,
    humanizeNumber,
    humanizeDate,
    getRangeCombinations
} from 'utilities'

import { Trade } from 'exchange'
import { Coin, HistoricalPrice, PriceHistory } from 'coin'

/**
 * A strategy for making a series of trades given a price history
 */
export abstract class Strategy {
    coin: Coin

    /**
     * @param coin - Coin to use
     */
    constructor({ coin }: { coin: Coin }) {
        this.coin = coin
    }

    /**
     * Backtest this strategy on historical prices to see what trades would have been made
     * @param coinAmount - Initial amount of coins
     * @param cashAmount - Initial amount of cash
     * @param tradingFeePercentage - Fee charged per trade
     * @param startDate - Date to start trading on. Default is the first date in the price history.
     * @param endDate - Date to end trading on. Default is the last date in the price history.
     * @param priceHistory - Manually set the price history for the coin
     * @returns Results of the backtest, including a list of trades and the profits that would have been made over that period
     */
    async backtest({
        coinAmount,
        cashAmount,
        tradingFeePercentage,
        startDate,
        endDate,
        priceHistory
    }: BacktestInput): Promise<BacktestResults> {
        priceHistory = await this.getPriceHistory({
            priceHistory,
            startDate,
            endDate
        })

        let results = new BacktestResults({
            coin: this.coin,
            startingCoinAmount: coinAmount,
            startingCashAmount: cashAmount,
            priceHistory,
            hodlComparison: new BacktestResults({
                coin: this.coin,
                startingCoinAmount: coinAmount,
                startingCashAmount: cashAmount,
                priceHistory
            })
        })

        let { trades, endingCoinAmount, endingCashAmount } = this.getTrades({
            priceHistory,
            coinAmount,
            cashAmount,
            tradingFeePercentage
        })

        results.trades = trades
        results.endingCoinAmount = endingCoinAmount
        results.endingCashAmount = endingCashAmount

        return results
    }

    protected abstract getTrades({
        priceHistory,
        coinAmount,
        cashAmount,
        tradingFeePercentage
    }: {
        priceHistory: PriceHistory
        coinAmount: number
        cashAmount: number
        tradingFeePercentage: number
    }): { trades: Trade[]; endingCoinAmount: number; endingCashAmount: number }

    async optimize({
        parameters,
        startDate,
        endDate,
        priceHistory,
        ...backtestInput
    }: OptimizeInput): Promise<OptimizationResults> {
        // Create the price history up front to prevent memory overflows due to creating many copies of the price history during backtesting
        priceHistory = await this.getPriceHistory({
            priceHistory,
            startDate,
            endDate
        })

        let parameterBacktestResults = []
        let parameterCombinations = getRangeCombinations(parameters)
        for (let parameterCombination of parameterCombinations) {
            for (let [key, value] of Object.entries(parameterCombination)) {
                Object.assign(this, { [key]: value })
            }
            parameterBacktestResults.push({
                parameters: parameterCombination,
                backtestResults: await this.backtest({
                    priceHistory,
                    ...backtestInput
                })
            })
        }

        parameterBacktestResults.sort((a, b) =>
            b.backtestResults.profit > a.backtestResults.profit ? 1 : -1
        )

        return new OptimizationResults({ results: parameterBacktestResults })
    }

    async getPriceHistory({
        priceHistory,
        startDate,
        endDate
    }: {
        priceHistory?: HistoricalPrice[] | PriceHistory
        startDate?: Date
        endDate?: Date
    }): Promise<PriceHistory> {
        if (priceHistory) {
            priceHistory =
                priceHistory instanceof PriceHistory
                    ? priceHistory
                    : new PriceHistory({ prices: priceHistory })
        } else {
            priceHistory = await this.coin.getPriceHistory()
        }

        if (startDate || endDate) {
            priceHistory = priceHistory.forRange({ startDate, endDate })
        }

        return priceHistory
    }
}

export interface BacktestInput {
    coinAmount: number
    cashAmount: number
    tradingFeePercentage: number
    startDate?: Date
    endDate?: Date
    priceHistory?: PriceHistory | HistoricalPrice[]
}

export class BacktestResults {
    coin: Coin
    startingCoinAmount: number
    startingCashAmount: number
    endingCoinAmount: number
    endingCashAmount: number
    trades: Trade[]
    priceHistory: PriceHistory
    hodlComparison?: BacktestResults

    /**
     * @param coin - Coin used
     * @param startingCoinAmount - Initial coin amount
     * @param startingCashAmount - Initial cash amount
     * @param endingCoinAmount - Final coin amount
     * @param endingCashAmount - Final cash amount
     * @param trades - Trades made
     * @param priceHistory - Price history over which trading was performed
     * @param hodlComparison - Hodl backtest results for comparison against these results
     */
    constructor({
        coin,
        startingCoinAmount,
        startingCashAmount,
        endingCoinAmount,
        endingCashAmount,
        trades,
        priceHistory,
        hodlComparison
    }: {
        coin: Coin
        startingCoinAmount: number
        startingCashAmount: number
        priceHistory: PriceHistory
        endingCoinAmount?: number
        endingCashAmount?: number
        trades?: Trade[]
        hodlComparison?: BacktestResults
    }) {
        this.coin = coin
        this.startingCoinAmount = startingCoinAmount
        this.startingCashAmount = startingCashAmount
        this.priceHistory = priceHistory
        this.endingCoinAmount = endingCoinAmount
            ? endingCoinAmount
            : startingCoinAmount
        this.endingCashAmount = endingCashAmount
            ? endingCashAmount
            : startingCashAmount
        this.trades = trades ? trades : []
        this.hodlComparison = hodlComparison
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

    get daysTraded(): number {
        return differenceInDays(
            this.priceHistory.endDate,
            this.priceHistory.startDate
        )
    }

    get doesBeatHodling(): boolean {
        return this.hodlComparison
            ? this.endingValue > this.hodlComparison.endingValue
            : false
    }

    get summary(): string {
        let summary = `This strategy made a profit of $${humanizeNumber(
            this.profit
        )}, with a yield of ${humanizeNumber(
            this.displayYield
        )}%. That's a ${humanizeNumber(this.multiplier)}x!`

        if (this.hodlComparison) {
            summary = `${summary}\nThis was ${
                this.doesBeatHodling ? 'better' : 'worse'
            } than simply hodling, which would have made a profit of $${humanizeNumber(
                this.hodlComparison.profit
            )} / ${humanizeNumber(
                this.hodlComparison.displayYield
            )}% / ${humanizeNumber(this.hodlComparison.multiplier)}x.`
        }

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
        Time: Traded ${this.trades.length} times over ${formatDuration(
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

interface OptimizeInput extends BacktestInput {
    parameters: Record<string, Range>
}

export class OptimizationResults {
    all: ParameterBacktestResults[]

    constructor({ results }: { results: ParameterBacktestResults[] }) {
        this.all = results
    }

    get best(): ParameterBacktestResults {
        return this.all[0]
    }

    get worst(): ParameterBacktestResults {
        return this.all[this.all.length - 1]
    }
}

interface ParameterBacktestResults {
    parameters: Record<string, number>
    backtestResults: BacktestResults
}
