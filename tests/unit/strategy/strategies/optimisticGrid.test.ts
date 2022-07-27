import { COINS } from 'coin'
import { EXCHANGES } from 'exchange'
import { OptimisticGridStrategy } from 'strategy'

let prices = [
    {
        date: new Date(2014, 1, 1),
        price: 500
    },
    {
        date: new Date(2014, 2, 1),
        price: 1000 // Sell 1/5th of coins => .2 coins @ $1000/coin = $200 => 0.8 BTC / $1200
    },
    {
        date: new Date(2014, 2, 1),
        price: 1400
    },
    {
        date: new Date(2014, 3, 1),
        price: 500 // Buy coins with 1/5th of cash => $240 @ 500/coin = 0.48 BTC => 1.28 BTC / $960
    },
    {
        date: new Date(2014, 4, 1),
        price: 400
    },
    {
        date: new Date(2014, 5, 1),
        price: 600
    },
    {
        date: new Date(2014, 6, 1),
        price: 1200
    },
    {
        date: new Date(2014, 7, 1),
        price: 250 // Buy coins with 1/5th of cash => $192 @ $250/coin = 0.768 BTC => 2.048 BTC / $768
    },
    {
        date: new Date(2014, 8, 1),
        price: 2000 // Sell 1/5th of coins => .4096 coins @ $2000/coin = $819.2 => 1.6384 BTC / $1587.2
    }
]

let strategy = new OptimisticGridStrategy({
    coin: COINS.bitcoin,
    sellThreshold: 100,
    buyThreshold: 50,
    buyPercentage: 20,
    sellPercentage: 20
})

describe('OptimisticGridStrategy', () => {
    it('only sells above and buys below previous highs', async () => {
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
            exchange: EXCHANGES.free,
            priceHistory: prices
        })

        expect(trades).toHaveLength(4)
        expect(buys).toHaveLength(2)
        expect(sells).toHaveLength(2)
        expect(startingCoinAmount).toBe(1)
        expect(startingCashAmount).toBe(1000)
        expect(endingCoinAmount).toBeCloseTo(1.6384)
        expect(endingCashAmount).toBeCloseTo(1587.2)
        expect(startingValue).toBeCloseTo(1500)
        expect(endingValue).toBeCloseTo(4864)
        expect(profit).toBeCloseTo(3364)
        expect(percentageYield).toBeCloseTo(224.266)
        expect(isProfitable).toBe(true)
    })
})
