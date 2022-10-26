import zod from 'zod'
import fse from 'fs-extra'
import { parseISO } from 'date-fns'
import parseCsv from 'csv-parse/lib/sync'

/**
 * A parsed historical price
 */
const RawHistoricalPrice = zod.object({
    date: zod.string(),
    closingPrice: zod.number()
})

type RawHistoricalPrice = zod.infer<typeof RawHistoricalPrice>

const RawHistoricalPrices = RawHistoricalPrice.array()

/**
 * A price of a coin on a given date
 */
export interface HistoricalPrice {
    date: Date
    price: number
}

export class PriceHistory {
    prices: HistoricalPrice[]

    constructor({ prices }: { prices: HistoricalPrice[] }) {
        if (prices.length === 0) {
            throw new TypeError('Price history is empty')
        }

        this.prices = prices
    }

    get startingPrice(): number {
        return this.prices[0].price
    }

    get endingPrice(): number {
        return this.prices[this.prices.length - 1].price
    }

    get startDate(): Date {
        return this.prices[0].date
    }

    get endDate(): Date {
        return this.prices[this.prices.length - 1].date
    }

    /**
     * @param startDate - The start date to use for the new price history
     * @param endDate - The end date to sue for the new price history
     * @returns A new PriceHistory spanning the startDate and endDate provided
     */
    forRange({
        startDate,
        endDate
    }: {
        startDate?: Date
        endDate?: Date
    }): PriceHistory {
        let pricesByDate = new Map<string, HistoricalPrice>()
        for (let price of this.prices) {
            pricesByDate.set(price.date.toISOString(), price)
        }

        startDate = startDate ? startDate : this.startDate
        endDate = endDate ? endDate : this.endDate
        let startingHistoricalPrice = pricesByDate.get(startDate.toISOString())
        let endingHistoricalPrice = pricesByDate.get(endDate.toISOString())

        if (!startingHistoricalPrice || !endingHistoricalPrice) {
            let dateMessage = !startingHistoricalPrice
                ? `startDate ${startDate}`
                : `endDate ${endDate}`
            throw new DateOutOfRangeError(
                `No historical price found for ${dateMessage}. Supported price range is ${this.startDate} - ${this.endDate}.`
            )
        }

        // Use subset of historical prices between start date and end date
        let targetPrices = this.prices.slice(
            this.prices.indexOf(startingHistoricalPrice),
            this.prices.indexOf(endingHistoricalPrice) + 1
        )

        return new PriceHistory({ prices: targetPrices })
    }

    static async loadFromCsv(filePath: string): Promise<PriceHistory> {
        let priceHistoryFileContent = await fse.readFile(filePath)
        let rawPriceHistory: unknown = parseCsv(priceHistoryFileContent, {
            columns: true,
            /* eslint-disable-next-line @typescript-eslint/naming-convention */
            skip_empty_lines: true
        })

        let parsedPriceHistory: RawHistoricalPrice[]
        try {
            parsedPriceHistory = RawHistoricalPrices.parse(rawPriceHistory)
        } catch (error) {
            throw new Error(`Failed to read price history for ${filePath}`)
        }

        if (parsedPriceHistory.length === 0) {
            throw new Error(`Price history is empty for ${filePath}`)
        }

        let historicalPrices = []
        for (let historicalPrice of parsedPriceHistory) {
            historicalPrices.push({
                // Specify zero time offset to prevent storing local time zone offset
                date: parseISO(`${historicalPrice.date}T00:00:00.000Z`),
                price: Number(historicalPrice.closingPrice)
            })
        }
        return new PriceHistory({ prices: historicalPrices })
    }
}

export class DateOutOfRangeError extends Error {}
