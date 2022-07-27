import { COINS } from 'coin'
import { EXCHANGES } from 'exchange'
import { BuyAndHodlStrategy } from 'strategy'

let prices = [
    {
        date: new Date(2014, 1, 1),
        price: 500
    },
    {
        date: new Date(2014, 2, 1),
        price: 2000
    },
    {
        date: new Date(2014, 3, 1),
        price: 3000
    },
    {
        date: new Date(2014, 74, 1),
        price: 1000
    }
]

let strategy = new BuyAndHodlStrategy({
    coin: COINS.BITCOIN
})

describe('BuyAndHodlStrategy', () => {
    it('buys and hodls through rain or shine', async () => {
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
            exchange: EXCHANGES.FREE,
            priceHistory: prices
        })

        expect(trades).toHaveLength(1)
        expect(startingCoinAmount).toBe(1)
        expect(startingCashAmount).toBe(1000)
        expect(endingCoinAmount).toBeCloseTo(3)
        expect(endingCashAmount).toBeCloseTo(0)
        expect(startingValue).toBeCloseTo(1500)
        expect(endingValue).toBeCloseTo(3000)
        expect(profit).toBeCloseTo(1500)
        expect(percentageYield).toBeCloseTo(100)
        expect(isProfitable).toBe(true)
    })
})
