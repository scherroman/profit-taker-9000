import { COINS } from 'coin'
import { HodlStrategy } from 'strategy'

let prices = [
    {
        date: new Date(2014, 1, 1),
        price: 768
    },
    {
        date: new Date(2014, 2, 1),
        price: 2000
    },
    {
        date: new Date(2014, 3, 1),
        price: 1000
    },
    {
        date: new Date(2014, 74, 1),
        price: 1050
    }
]

let strategy = new HodlStrategy({
    coin: COINS.bitcoin
})

describe('NaiveGridStrategy', () => {
    it('hodls through rain or shine', async () => {
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
        expect(startingValue).toBeCloseTo(1768)
        expect(endingValue).toBeCloseTo(2050)
        expect(profit).toBeCloseTo(282)
        expect(percentageYield).toBeCloseTo(0.15950226)
        expect(isProfitable).toBe(true)
    })
})
