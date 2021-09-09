import { COINS } from 'coin'
import { TradeType } from 'exchange'
import { NaiveGridStrategy } from 'strategy'

let strategy = new NaiveGridStrategy({
    coin: COINS.bitcoin,
    triggerPercentage: 0.1,
    tradePercentage: 0.1
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
            trades
        } = await strategy.backtest({
            coinAmount: 1,
            cashAmount: 1000,
            tradingFeePercentage: 0.005,
            historicalPrices: basicPrices
        })
        let buys = trades.filter((trade) => trade.type === TradeType.Buy)
        let sells = trades.filter((trade) => trade.type === TradeType.Sell)

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
        expect(percentageYield).toBeCloseTo(-0.00996731)
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
            profit,
            percentageYield,
            isProfitable,
            startingValue,
            endingValue,
            startingCoinAmount,
            startingCashAmount,
            endingCoinAmount,
            endingCashAmount,
            trades
        } = await strategy.backtest({
            coinAmount: 1,
            cashAmount: 1000,
            tradingFeePercentage: 0.05,
            historicalPrices: prices
        })

        expect(trades).toHaveLength(0)
        expect(startingCoinAmount).toBe(1)
        expect(startingCashAmount).toBe(1000)
        expect(endingCoinAmount).toBeCloseTo(1)
        expect(endingCashAmount).toBeCloseTo(1000)
        expect(startingValue).toBeCloseTo(1773)
        expect(endingValue).toBeCloseTo(1755)
        expect(profit).toBe(-18)
        expect(percentageYield).toBeCloseTo(-0.01015228)
        expect(isProfitable).toBe(false)
    })
    it('will not sell if there are no coins', async () => {
        let prices = basicPrices.slice(0, 2)
        let { trades } = await strategy.backtest({
            coinAmount: 0,
            cashAmount: 1000,
            tradingFeePercentage: 0.005,
            historicalPrices: prices
        })
        expect(trades).toHaveLength(0)
    })
    it('will not buy if there is no cash', async () => {
        let prices = basicPrices.slice(1, 3)
        let { trades } = await strategy.backtest({
            coinAmount: 1,
            cashAmount: 0,
            tradingFeePercentage: 0.005,
            historicalPrices: prices
        })
        expect(trades).toHaveLength(0)
    })
    it('only targets historical prices between the start and end dates', async () => {
        let { trades } = await strategy.backtest({
            coinAmount: 1,
            cashAmount: 1000,
            tradingFeePercentage: 0.05,
            startDate: new Date(2014, 1, 1),
            endDate: new Date(2014, 2, 1),
            historicalPrices: basicPrices
        })
        let buys = trades.filter((trade) => trade.type === TradeType.Buy)
        let sells = trades.filter((trade) => trade.type === TradeType.Sell)

        expect(trades).toHaveLength(1)
        expect(buys).toHaveLength(0)
        expect(sells).toHaveLength(1)
    })
})
