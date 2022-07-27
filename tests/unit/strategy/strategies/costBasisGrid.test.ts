import { COINS } from 'coin'
import { EXCHANGES } from 'exchange'
import { CostBasisGridStrategy } from 'strategy'

// 1st Cost basis 1000
// 2nd Cost basis not provided, automatically set to 500
let prices = [
    {
        date: new Date(2014, 1, 1),
        price: 500 // Buy with 1/5th of cash => .4 coins @ $500/coin = $200 => 1.4 BTC / $800, cost basis (1 / 1.4) * 1000 + (.4 / 1.4) * 500 = $714.285714 + $142.857142 = $857.142857
    },
    {
        date: new Date(2014, 2, 1),
        price: 1000
    }, // Sell 1/2 of coins => .5 coins @ $1000/coin = $500 => .5 BTC / $1500, cost basis (.5 / .5) * 500 = $500, cost basis same as above
    {
        date: new Date(2014, 2, 1),
        price: 1400
    },
    {
        date: new Date(2014, 3, 1),
        price: 500
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
        price: 250
    }, // Buy coins with 1/5th of cash => 1.2 coins @ $250/coin = $300 => 1.7 BTC / $1200, cost basis (.5 / 1.7) * 500 + (1.2 / 1.7) * 250 = $147.058824 + $176.470588 = $323.529412
    {
        date: new Date(2014, 8, 1),
        price: 200 // Buy coins with 1/5th of cash => .8 coins @ $200/coin = $160 => 2.2 BTC / $640, cost basis (1 / 2.2) * 1000 + (.4 / 2.2) * 500 + (.8 / 2.2) * 200 = $454.545455 + $90.9090909 + $72.7272727 = $618.181819
    },
    {
        date: new Date(2014, 8, 1),
        price: 2000 // Sell 1/2 of coins => 1.1 coins @ $2000/coin = $2200 => 1.1 BTC / $2840, same cost basis as above
    } // Sell 1/2 coins => .85 coins @ $2000/coin = $1700 => .85 BTC / $2900, cost basis same as above
]

let strategy = new CostBasisGridStrategy({
    coin: COINS.BITCOIN,
    sellThreshold: 100,
    buyThreshold: 50,
    buyPercentage: 20,
    sellPercentage: 50,
    costBasis: 1000
})

describe('CostBasisGridStrategy', () => {
    it('only sells above and buys below cost basis', async () => {
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
            exchange: EXCHANGES.FREE,
            priceHistory: prices
        })

        expect(trades).toHaveLength(3)
        expect(buys).toHaveLength(2)
        expect(sells).toHaveLength(1)
        expect(startingCoinAmount).toBe(1)
        expect(startingCashAmount).toBe(1000)
        expect(endingCoinAmount).toBeCloseTo(1.1)
        expect(endingCashAmount).toBeCloseTo(2840)
        expect(startingValue).toBeCloseTo(1500)
        expect(endingValue).toBeCloseTo(5040)
        expect(profit).toBeCloseTo(3540)
        expect(percentageYield).toBeCloseTo(236)
        expect(isProfitable).toBe(true)
    })
    it('uses start date price as cost basis if none is provided', async () => {
        let strategy = new CostBasisGridStrategy({
            coin: COINS.BITCOIN,
            sellThreshold: 100,
            buyThreshold: 50,
            buyPercentage: 20,
            sellPercentage: 50
        })

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
            exchange: EXCHANGES.FREE,
            priceHistory: prices
        })

        expect(trades).toHaveLength(3)
        expect(buys).toHaveLength(1)
        expect(sells).toHaveLength(2)
        expect(startingCoinAmount).toBe(1)
        expect(startingCashAmount).toBe(1000)
        expect(endingCoinAmount).toBeCloseTo(0.85)
        expect(endingCashAmount).toBeCloseTo(2900)
        expect(startingValue).toBeCloseTo(1500)
        expect(endingValue).toBeCloseTo(4600)
        expect(profit).toBeCloseTo(3100)
        expect(percentageYield).toBeCloseTo(206.666)
        expect(isProfitable).toBe(true)
    })
})
