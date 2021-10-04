import { COINS } from 'coin'
import { EXCHANGES } from 'exchange'
import { NaiveGridStrategy, ParameterRangeError } from 'strategy'

let strategy = new NaiveGridStrategy({
    coin: COINS.bitcoin,
    buyThreshold: 10,
    sellThreshold: 10,
    tradePercentage: 10
})

let basicPrices = [
    {
        date: new Date(2014, 1, 1),
        price: 768 // Starting price
    },
    {
        date: new Date(2014, 2, 1),
        price: 847 // Sell 10% (.1 BTC / $84.7) at $847/BTC w/0.5% fee ($0.4235) = .9 BTC & $1084.2765
    },
    {
        date: new Date(2014, 3, 1),
        price: 750 // Buy 10% ($108.42765 / .1445702 BTC) at $750/BTC w/0.5% fee ($0.54213825) = 1.0445702 BTC & $975.306712
    },
    {
        date: new Date(2014, 74, 1),
        price: 742
    }
]

describe('NaiveGridStrategy', () => {
    it('sells and buys when trigger percentages are met', async () => {
        let {
            profit,
            percentageYield,
            isProfitable,
            startingValue,
            endingValue,
            startingCoinAmount,
            startingCashAmount,
            endingCoinAmount,
            endingCashAmount,
            trades,
            buys,
            sells
        } = await strategy.backtest({
            coinAmount: 1,
            cashAmount: 1000,
            exchange: EXCHANGES.coinbasePro,
            priceHistory: basicPrices
        })

        expect(trades).toHaveLength(2)
        expect(buys).toHaveLength(1)
        expect(sells).toHaveLength(1)
        expect(startingCoinAmount).toBe(1)
        expect(startingCashAmount).toBe(1000)
        expect(endingCoinAmount).toBeCloseTo(1.0445702)
        expect(endingCashAmount).toBeCloseTo(975.306712)
        expect(startingValue).toBeCloseTo(1768)
        expect(endingValue).toBeCloseTo(1750.3778)
        expect(profit).toBeCloseTo(-17.6222)
        expect(percentageYield).toBeCloseTo(-0.996731)
        expect(isProfitable).toBe(false)
    })
    it("doesn't sell or buy when trigger percentages are not met", async () => {
        let prices = [
            {
                date: new Date(2014, 1, 1),
                price: 773
            },
            {
                date: new Date(2014, 2, 1),
                price: 780
            },
            {
                date: new Date(2014, 3, 1),
                price: 760
            },
            {
                date: new Date(2014, 4, 1),
                price: 755
            }
        ]

        let {
            startingCoinAmount,
            startingCashAmount,
            endingCoinAmount,
            endingCashAmount,
            trades
        } = await strategy.backtest({
            coinAmount: 1,
            cashAmount: 1000,
            exchange: EXCHANGES.coinbasePro,
            priceHistory: prices
        })

        expect(trades).toHaveLength(0)
        expect(startingCoinAmount).toBe(1)
        expect(startingCashAmount).toBe(1000)
        expect(endingCoinAmount).toBeCloseTo(1)
        expect(endingCashAmount).toBeCloseTo(1000)
    })
    it('buys and sells on exact price matches', async () => {
        let prices = [
            {
                date: new Date(2014, 1, 1),
                price: 100
            },
            {
                date: new Date(2014, 2, 1),
                price: 110
            },
            {
                date: new Date(2014, 3, 1),
                price: 99
            }
        ]

        let { trades, buys, sells } = await strategy.backtest({
            coinAmount: 1,
            cashAmount: 1000,
            exchange: EXCHANGES.coinbasePro,
            priceHistory: prices
        })

        expect(trades).toHaveLength(2)
        expect(buys).toHaveLength(1)
        expect(sells).toHaveLength(1)
    })
    it('adapts the buy price to a multiple that mirrors the sell price multiple when the trigger threshold is 100 or more', async () => {
        let strategy = new NaiveGridStrategy({
            coin: COINS.bitcoin,
            buyThreshold: 80,
            sellThreshold: 400,
            tradePercentage: 10
        })
        let prices = [
            {
                date: new Date(2014, 1, 1),
                price: 100
            },
            {
                date: new Date(2014, 2, 1),
                price: 500
            },
            {
                date: new Date(2014, 3, 1),
                price: 100
            },
            {
                date: new Date(2014, 4, 1),
                price: 500
            },
            {
                date: new Date(2014, 4, 1),
                price: 200
            }
        ]

        let { trades, buys, sells } = await strategy.backtest({
            coinAmount: 1,
            cashAmount: 1000,
            exchange: EXCHANGES.coinbasePro,
            priceHistory: prices
        })

        expect(trades).toHaveLength(3)
        expect(buys).toHaveLength(1)
        expect(sells).toHaveLength(2)
    })
    it('will not sell if there are no coins', async () => {
        let prices = basicPrices.slice(0, 2)
        let { trades } = await strategy.backtest({
            coinAmount: 0,
            cashAmount: 1000,
            exchange: EXCHANGES.coinbasePro,
            priceHistory: prices
        })
        expect(trades).toHaveLength(0)
    })
    it('will not buy if there is no cash', async () => {
        let prices = basicPrices.slice(1, 3)
        let { trades } = await strategy.backtest({
            coinAmount: 1,
            cashAmount: 0,
            exchange: EXCHANGES.coinbasePro,
            priceHistory: prices
        })
        expect(trades).toHaveLength(0)
    })
    it('only targets historical prices between the start and end dates', async () => {
        let { trades, buys, sells } = await strategy.backtest({
            coinAmount: 1,
            cashAmount: 1000,
            exchange: EXCHANGES.coinbasePro,
            startDate: new Date(2014, 1, 1),
            endDate: new Date(2014, 2, 1),
            priceHistory: basicPrices
        })

        expect(trades).toHaveLength(1)
        expect(buys).toHaveLength(0)
        expect(sells).toHaveLength(1)
    })
})

let optimizePrices = [
    {
        date: new Date(2014, 1, 1),
        price: 100
    },
    {
        date: new Date(2014, 2, 1),
        price: 200
    },
    {
        date: new Date(2014, 3, 1),
        price: 300
    },
    {
        date: new Date(2014, 3, 1),
        price: 50
    }
]

let optimizeStrategy = new NaiveGridStrategy({
    coin: COINS.bitcoin,
    buyThreshold: 10,
    sellThreshold: 10,
    tradePercentage: 10
})

describe('NaiveGridStrategy.optimize', () => {
    it('finds the best and worst parameter combinations', async () => {
        let { all } = await optimizeStrategy.optimize({
            coinAmount: 1,
            cashAmount: 1000,
            exchange: EXCHANGES.coinbasePro,
            priceHistory: optimizePrices,
            parameterRanges: {
                buyThreshold: {
                    minimum: 0,
                    maximum: 100,
                    step: 10
                },
                sellThreshold: {
                    minimum: 0,
                    maximum: 100,
                    step: 10
                },
                tradePercentage: {
                    minimum: 0,
                    maximum: 100,
                    step: 10
                }
            }
        })

        expect(all).toHaveLength(1331)
        let previousResult = null
        for (let result of all) {
            if (!previousResult) {
                continue
            }

            expect(
                result.backtestResults.profit >=
                    previousResult.backtestResults.profit
            ).toBe(true)

            previousResult = result
        }
    })
    it('throws an error if parameters are missing', async () => {
        await expect(
            optimizeStrategy.optimize({
                coinAmount: 1,
                cashAmount: 1000,
                exchange: EXCHANGES.coinbasePro,
                priceHistory: optimizePrices,
                parameterRanges: {
                    buyThreshold: {
                        minimum: 0,
                        maximum: 100,
                        step: 10
                    }
                }
            })
        ).rejects.toThrow(ParameterRangeError)
    })
    it('throws an error if parameter ranges exceed the supported range', async () => {
        await expect(
            optimizeStrategy.optimize({
                coinAmount: 1,
                cashAmount: 1000,
                exchange: EXCHANGES.coinbasePro,
                priceHistory: optimizePrices,
                parameterRanges: {
                    buyThreshold: {
                        minimum: 0,
                        maximum: 101,
                        step: 10
                    },
                    sellThreshold: {
                        minimum: 0,
                        maximum: 100,
                        step: 10
                    },
                    tradePercentage: {
                        minimum: 0,
                        maximum: 100,
                        step: 1
                    }
                }
            })
        ).rejects.toThrow(ParameterRangeError)
    })
})
