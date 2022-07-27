import { getRangeCombinations } from 'utilities'

import { Exchange, Trade } from 'exchange'
import { Coin, HistoricalPrice, PriceHistory } from 'coin'
import { BacktestInput, BacktestResults } from './backtest'
import {
    Parameter,
    ParameterRanges,
    OptimizeInput,
    OptimizationResults,
    ParameterBacktestResults
} from './optimize'

/**
 * A strategy for making a series of trades given a price history
 */
export abstract class Strategy {
    coin: Coin
    abstract readonly parameters: Parameter[]

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
     * @param exchange - Exchange to trade on
     * @param startDate - Date to start trading on. Default is the first date in the price history.
     * @param endDate - Date to end trading on. Default is the last date in the price history.
     * @param priceHistory - Manually set the price history for the coin
     * @returns Results of the backtest, including a list of trades and the profits that would have been made over that period
     */
    async backtest({
        coinAmount,
        cashAmount,
        exchange,
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
            exchange
        })

        let { trades, endingCoinAmount, endingCashAmount } = this.getTrades({
            priceHistory,
            coinAmount,
            cashAmount,
            exchange
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
        exchange
    }: {
        priceHistory: PriceHistory
        coinAmount: number
        cashAmount: number
        exchange: Exchange
    }): { trades: Trade[]; endingCoinAmount: number; endingCashAmount: number }

    /**
     * Test this strategy against all possible parameter values to find the optimal set of parameters
     * @param parameterRanges - Range of possible values for each parameter
     * @returns Results of backtesting all possible parameter values, including best and worst performers
     */
    async optimize({
        parameterRanges,
        startDate,
        endDate,
        priceHistory,
        ...backtestInput
    }: OptimizeInput): Promise<OptimizationResults> {
        this.#validateParameterRanges(parameterRanges)

        // Create the price history up front to prevent memory overflows due to creating many copies of the price history during backtesting
        priceHistory = await this.getPriceHistory({
            priceHistory,
            startDate,
            endDate
        })

        let parameterBacktestResults = []
        let parameterCombinations = getRangeCombinations(parameterRanges)
        for (let parameterCombination of parameterCombinations) {
            for (let [key, value] of Object.entries(parameterCombination)) {
                Object.assign(this, { [key]: value })
            }
            parameterBacktestResults.push(
                new ParameterBacktestResults({
                    parameterValues: parameterCombination,
                    backtestResults: await this.backtest({
                        priceHistory,
                        ...backtestInput
                    })
                })
            )
        }

        return new OptimizationResults({
            results: parameterBacktestResults,
            parameters: this.parameters,
            parameterRanges
        })
    }

    protected validateParameter(
        parameterValue: number,
        parameter: Parameter
    ): void {
        let { minimum, maximum } = parameter
        if (parameterValue < minimum || (maximum && parameterValue > maximum)) {
            throw new ParameterRangeError(
                `Invalid ${parameter.name} ${parameterValue}. Value must be between ${minimum} and ${maximum}`
            )
        }
    }

    #validateParameterRanges(parameterRanges: ParameterRanges): void {
        for (let parameter of this.parameters) {
            let parameterRange = parameterRanges[parameter.name]

            if (!parameterRange) {
                throw new ParameterRangeError(
                    `Missing range for parameter ${parameter.name}`
                )
            }

            if (parameterRange.minimum < parameter.minimum) {
                throw new ParameterRangeError(
                    `Parameter range minimum ${parameterRange.minimum} provided for ${parameter.name} is lower than the supported minimum ${parameter.minimum}`
                )
            }

            if (
                parameter.maximum &&
                parameterRange.maximum > parameter.maximum
            ) {
                throw new ParameterRangeError(
                    `Parameter range maximum ${parameterRange.maximum} provided for ${parameter.name} is larger than the supported maximum ${parameter.maximum}`
                )
            }
        }
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

export class ParameterRangeError extends Error {}
