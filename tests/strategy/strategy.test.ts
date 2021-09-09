import { COINS, PriceHistory } from 'coin'
import { TradeType } from 'exchange'
import { BacktestResults } from 'strategy'

let backtestResults = new BacktestResults({
    coin: COINS.bitcoin,
    startingCoinAmount: 1,
    startingCashAmount: 1000,
    endingCoinAmount: 0.5,
    endingCashAmount: 1100,
    trades: [
        {
            type: TradeType.Sell,
            amount: 0.5,
            price: 200,
            date: new Date(2013, 6, 1)
        }
    ],
    priceHistory: new PriceHistory({
        prices: [
            {
                date: new Date(2013, 0, 1),
                price: 100
            },
            {
                date: new Date(2013, 6, 1),
                price: 200
            },
            {
                date: new Date(2013, 11, 31),
                price: 300
            }
        ]
    })
})

describe('BacktestResults', () => {
    it('calculates startingValue correctly', () => {
        expect(backtestResults.startingValue).toBe(1100)
    })
    it('calculates endingValue correctly', () => {
        expect(backtestResults.endingValue).toBe(1250)
    })
    it('calculates profit correctly', () => {
        expect(backtestResults.profit).toBe(150)
    })
    it('calculates percentageYield correctly', () => {
        expect(backtestResults.percentageYield).toBeCloseTo(0.13636364)
    })
    it('calculates displayYield correctly', () => {
        expect(backtestResults.displayYield).toBeCloseTo(13.636364)
    })
    it('calculates multiplier correctly', () => {
        expect(backtestResults.multiplier).toBeCloseTo(1.13636364)
    })
    it('computes isProfitable correctly', () => {
        expect(backtestResults.isProfitable).toBe(true)
    })
    it('calculates daysTraded correctly', () => {
        expect(backtestResults.daysTraded).toBe(364)
    })
    it('calculates doesBeatHodling correctly', () => {
        expect(backtestResults.doesBeatHodling).toBe(false)
    })
})
