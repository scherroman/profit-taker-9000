import { promises as fs } from 'fs'
import { parseISO } from 'date-fns'
import parseCsv from 'csv-parse/lib/sync'

/**
 * A cryptocurrency
 */
export class Coin {
    name: string
    symbol: string
    #priceHistory?: PriceHistory

    /**
     * @param name - Name of the coin
     * @param symbol - Ticker symbol of the coin
     */
    constructor({ name, symbol }: { name: string; symbol: string }) {
        this.name = name
        this.symbol = symbol
    }

    /**
     * @returns Price history for the coin
     */
    async getPriceHistory(): Promise<PriceHistory> {
        if (this.#priceHistory) {
            return this.#priceHistory
        }

        let priceHistoryFileContent = await fs.readFile(
            `./data/priceHistories/${this.symbol}.csv`
        )
        let rawPriceHistory: unknown = parseCsv(priceHistoryFileContent, {
            columns: true,
            /* eslint-disable-next-line @typescript-eslint/naming-convention */
            skip_empty_lines: true
        })

        if (
            !isArrayOfRawHistoricalPrices(rawPriceHistory) ||
            rawPriceHistory.length === 0
        ) {
            throw new Error(`Failed to read price history for ${this.symbol}`)
        }

        let historicalPrices = []
        for (let historicalPrice of rawPriceHistory) {
            historicalPrices.push({
                date: parseISO(historicalPrice.date),
                price: Number(historicalPrice.closingPrice)
            })
        }
        this.#priceHistory = new PriceHistory({ prices: historicalPrices })

        return this.#priceHistory
    }
}

export const COINS: Record<string, Coin> = {
    bitcoin: new Coin({
        name: 'Bitcoin',
        symbol: 'BTC'
    })
}

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
}

export class DateOutOfRangeError extends Error {}
