import { addDays, subDays } from 'date-fns'

import { COINS, getCoinPrices } from 'coin'

describe('getCoinPrices', () => {
    it('retrieves coin prices from the requested date', async () => {
        let prices = await getCoinPrices(COINS.bitcoin, subDays(new Date(), 1))
        expect(prices).toHaveLength(2)

        prices = await getCoinPrices(COINS.bitcoin, subDays(new Date(), 10))
        expect(prices).toHaveLength(11)
    })
    it("retrieves the last day's price if the requested date is less than a day ago", async () => {
        let prices = await getCoinPrices(COINS.bitcoin, new Date())
        expect(prices).toHaveLength(1)
    })
    it('retrieves no prices if the requested date is in the future', async () => {
        let prices = await getCoinPrices(COINS.bitcoin, addDays(new Date(), 1))
        expect(prices).toHaveLength(0)
    })
    it('retrieves coin prices from the oldest date available if no date is provided', async () => {
        let prices = await getCoinPrices(COINS.bitcoin)
        expect(prices.length).toBeGreaterThan(0)
    })
})
