import { EXCHANGES, TradeType } from 'exchange'

let exchange = EXCHANGES.coinbasePro
let historicalPrice = {
    price: 100,
    date: new Date()
}

describe('exchange.buy', () => {
    it('returns a trade, new coin amount, and new cash amount properly', () => {
        let { trade, newCoinAmount, newCashAmount } = exchange.buy({
            amount: 100,
            historicalPrice,
            initialCoinAmount: 0,
            initialCashAmount: 200
        })
        expect(trade).toMatchObject({
            type: TradeType.Buy,
            amount: 1,
            price: 100,
            date: historicalPrice.date
        })
        expect(newCoinAmount).toBe(1)
        expect(newCashAmount).toBeCloseTo(99.5)
    })
})

describe('exchange.sell', () => {
    it('returns a trade, new coin amount, and new cash amount properly', () => {
        let { trade, newCoinAmount, newCashAmount } = exchange.sell({
            amount: 0.5,
            historicalPrice,
            initialCoinAmount: 1,
            initialCashAmount: 0
        })
        expect(trade).toMatchObject({
            type: TradeType.Sell,
            amount: 0.5,
            price: 100,
            date: historicalPrice.date
        })
        expect(newCoinAmount).toBe(0.5)
        expect(newCashAmount).toBeCloseTo(49.75)
    })
})
