import fse from 'fs-extra'
import axios, { AxiosInstance } from 'axios'
import { addDays, differenceInDays } from 'date-fns'
import stringifyCsv from 'csv-stringify/lib/sync'

import { Coin } from './coin'
import { HistoricalPrice, PriceHistory } from './priceHistory'

const ISO_8601_YEAR_MONTH_DAY_SUBSTRING_END_INDEX = 10

/**
 * Fetches and stores the price history for the given coin
 * @param coin - Coin to fetch prices for
 * @returns An array of the historical prices that were added to the price history
 */
export async function updatePriceHistory(
    coin: Coin
): Promise<HistoricalPrice[]> {
    let priceHistory: PriceHistory | undefined
    let fromDate: Date | undefined
    if (fse.existsSync(coin.priceHistoryFilePath)) {
        priceHistory = await PriceHistory.loadFromCsv(coin.priceHistoryFilePath)
        fromDate = addDays(
            priceHistory.prices[priceHistory.prices.length - 1].date,
            1
        )
    }

    let newPrices = await getCoinPrices(coin, fromDate)

    if (newPrices.length > 0) {
        if (priceHistory) {
            priceHistory.prices = [...priceHistory.prices, ...newPrices]
        } else {
            priceHistory = new PriceHistory({ prices: newPrices })
        }

        let csvString = stringifyCsv([
            ['date', 'closingPrice'],
            ...Array.from(priceHistory.prices, (price) => [
                price.date
                    .toISOString()
                    .slice(0, ISO_8601_YEAR_MONTH_DAY_SUBSTRING_END_INDEX),
                price.price
            ])
        ])

        await fse.outputFile(coin.priceHistoryFilePath, csvString)
    }

    return newPrices
}

/**
 *
 * @param coin - Coin to get prices for
 * @param fromDate - Date from which to get prices, inclusive
 */
export async function getCoinPrices(
    coin: Coin,
    fromDate?: Date
): Promise<HistoricalPrice[]> {
    let coinGeckoClient = new CoinGeckoClient()
    let prices: HistoricalPrice[]
    try {
        prices = await coinGeckoClient.getHistoricalPrices(
            coin.symbol,
            fromDate
        )
    } catch (error) {
        console.log('Failed to load coin prices')
        throw error
    }

    return prices
}

class CoinGeckoClient {
    private api: AxiosInstance
    constructor() {
        this.api = axios.create({
            /* eslint-disable @typescript-eslint/naming-convention */
            baseURL: 'https://api.coingecko.com/api/v3/',
            headers: { 'Content-Type': 'application/json' }
            /* eslint-enable @typescript-eslint/naming-convention */
        })
    }

    async getHistoricalPrices(
        coinSymbol: string,
        fromDate?: Date
    ): Promise<HistoricalPrice[]> {
        let coinId: string
        let data = await this.search(coinSymbol)
        let firstResult = data.coins[0]
        if (firstResult.symbol === coinSymbol) {
            coinId = firstResult.id
        } else {
            throw new Error(`Failed to find coinGecko id for ${coinSymbol}`)
        }

        let marketChart = await this.getMarketChart(coinId, fromDate)

        let historicalPrices: HistoricalPrice[] = []
        for (let priceForDate of marketChart.prices) {
            let [unixTime, price] = priceForDate
            let date = new Date(unixTime)
            // Only include final closing prices
            if (
                date.getUTCHours() === 0 &&
                date.getUTCMinutes() === 0 &&
                date.getUTCSeconds() === 0 &&
                date.getUTCMilliseconds() === 0
            ) {
                historicalPrices.push({ date: date, price: price })
            }
        }

        return historicalPrices
    }

    private async search(query: string): Promise<CoinSearchResponse> {
        let data: unknown = await this.get(`search?query=${query}`)

        if (!isCoinSearchResponse(data) || !isArrayOfCoinResults(data.coins)) {
            throw new Error('Failed to parse search results')
        }

        return data
    }

    private async getMarketChart(
        id: string,
        fromDate?: Date
    ): Promise<CoinMarketChartResponse> {
        let days = 'max'
        if (fromDate) {
            if (fromDate > new Date()) {
                days = '0'
            } else {
                days = (differenceInDays(new Date(), fromDate) + 1).toString()
            }
        }
        let data: unknown = await this.get(
            `coins/${id}/market_chart?id=${id}&vs_currency=usd&days=${days}&interval=daily`
        )

        if (!isCoinMarketChartResponse(data)) {
            throw new Error('Failed to parse market chart results')
        }

        return data
    }

    private async get(url: string): Promise<unknown> {
        let data: unknown = (await this.api.get(url)).data
        return data
    }
}

interface CoinSearchResponse {
    coins: CoinResult[]
}

interface CoinResult {
    id: string
    symbol: string
}

function isCoinResult(value: unknown): value is CoinResult {
    return (
        typeof value === 'object' &&
        value !== null &&
        'id' in value &&
        'symbol' in value
    )
}

function isArrayOfCoinResults(value: unknown): value is CoinResult[] {
    return (
        Array.isArray(value) && value.every((element) => isCoinResult(element))
    )
}

function isCoinSearchResponse(value: unknown): value is CoinSearchResponse {
    return typeof value === 'object' && value !== null && 'coins' in value
}

interface CoinMarketChartResponse {
    prices: number[][]
}

function isCoinMarketChartResponse(
    value: unknown
): value is CoinMarketChartResponse {
    return typeof value === 'object' && value !== null && 'prices' in value
}
