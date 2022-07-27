import { isEqual } from 'date-fns'
import { PriceHistory, DateOutOfRangeError } from 'coin'

describe('PriceHistory', () => {
    it('returns the correct starting and ending prices/dates with multiple historical prices', () => {
        let priceHistory = new PriceHistory({
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
        expect(priceHistory.startingPrice).toBe(100)
        expect(priceHistory.endingPrice).toBe(300)
        expect(isEqual(priceHistory.startDate, new Date(2013, 0, 1))).toBe(true)
        expect(isEqual(priceHistory.endDate, new Date(2013, 11, 31))).toBe(true)
    }),
        it('returns the correct starting and ending prices/dates with a single historical prices', () => {
            let priceHistory = new PriceHistory({
                prices: [
                    {
                        date: new Date(2013, 6, 1),
                        price: 200
                    }
                ]
            })
            expect(priceHistory.startingPrice).toBe(200)
            expect(priceHistory.endingPrice).toBe(200)
            expect(isEqual(priceHistory.startDate, new Date(2013, 6, 1))).toBe(
                true
            )
            expect(isEqual(priceHistory.endDate, new Date(2013, 6, 1))).toBe(
                true
            )
        }),
        it('throws an error if there are no prices', () => {
            expect(
                () =>
                    new PriceHistory({
                        prices: []
                    })
            ).toThrow()
        })
    it('forRange throws an error if the start date or end date is outside the price history date range', async () => {
        let priceHistory = new PriceHistory({
            prices: [
                {
                    date: new Date(2014, 1, 1),
                    price: 773
                },
                {
                    date: new Date(2014, 2, 1),
                    price: 780
                }
            ]
        })

        expect(() =>
            priceHistory.forRange({
                startDate: new Date(2012, 1, 1)
            })
        ).toThrow(DateOutOfRangeError)
        expect(() =>
            priceHistory.forRange({
                endDate: new Date(2030, 1, 1)
            })
        ).toThrow(DateOutOfRangeError)
    })
})
