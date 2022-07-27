import { promises as fs } from 'fs'
import { parseISO } from 'date-fns'
import parseCsv from 'csv-parse/lib/sync'

function isArrayOfRawHistoricalPrices(
    value: unknown
): value is RawHistoricalPrice[] {
    return (
        Array.isArray(value) &&
        value.every((element) => isRawHistoricalPrice(element))
    )
}

function isRawHistoricalPrice(value: unknown): value is RawHistoricalPrice {
    return (
        typeof value === 'object' &&
        value !== null &&
        'date' in value &&
        'closingPrice' in value
    )
}

/**
 * A price of a coin on a given date
 */
export interface HistoricalPrice {
    date: Date
    price: number
}

/**
 * A parsed historical price
 */
interface RawHistoricalPrice {
    date: string
    closingPrice: number
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
        let priceHistoryFileContent = await fs.readFile(filePath)
        let rawPriceHistory: unknown = parseCsv(priceHistoryFileContent, {
            columns: true,
            /* eslint-disable-next-line @typescript-eslint/naming-convention */
            skip_empty_lines: true
        })

        if (
            !isArrayOfRawHistoricalPrices(rawPriceHistory) ||
            rawPriceHistory.length === 0
        ) {
            throw new Error(`Failed to read price history for ${filePath}`)
        }

        let historicalPrices = []
        for (let historicalPrice of rawPriceHistory) {
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
