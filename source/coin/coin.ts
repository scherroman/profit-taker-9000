import fs from 'fs'
import { HistoricalPrice, PriceHistory } from './priceHistory'
import { updatePriceHistory } from './utilities'

const PRICE_HISTORIES_PATH = './data/priceHistories'

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

    get priceHistoryFilePath(): string {
        return `${PRICE_HISTORIES_PATH}/${this.symbol}.csv`
    }

    /**
     * @returns Price history for the coin
     */
    async getPriceHistory(): Promise<PriceHistory> {
        if (this.#priceHistory) {
            return this.#priceHistory
        }

        if (!fs.existsSync(this.priceHistoryFilePath)) {
            await updatePriceHistory(this)
        }

        this.#priceHistory = await PriceHistory.loadFromCsv(
            this.priceHistoryFilePath
        )

        return this.#priceHistory
    }

    async updatePriceHistory(): Promise<HistoricalPrice[]> {
        let prices = await updatePriceHistory(this)
        return prices
    }
}

export const COINS = {
    /* eslint-disable @typescript-eslint/naming-convention */
    BITCOIN: new Coin({
        name: 'Bitcoin',
        symbol: 'BTC'
    }),
    ETHEREUM: new Coin({
        name: 'Ethereum',
        symbol: 'ETH'
    })
    /* eslint-enable @typescript-eslint/naming-convention */
}
