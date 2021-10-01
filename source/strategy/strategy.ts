import { getRangeCombinations } from 'utilities'

import { Trade } from 'exchange'
import { Coin, HistoricalPrice, PriceHistory } from 'coin'
import { BacktestInput, BacktestResults } from './backtest'
import { Parameter, OptimizeInput, OptimizationResults } from './optimize'

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
            parameterBacktestResults.push({
                parameterValues: parameterCombination,
                backtestResults: await this.backtest({
                    priceHistory,
                    ...backtestInput
                })
            })
        }

        return new OptimizationResults({
            results: parameterBacktestResults,
            parameters: this.parameters,
            parameterRanges
        })
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
