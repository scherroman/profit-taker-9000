import { PriceHistory } from './priceHistory'
import { updateCoinPrices } from './utilities'

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

        this.#priceHistory = await PriceHistory.loadFromCsv(
            this.priceHistoryFilePath
        )

        return this.#priceHistory
    }

    async updatePriceHistory(): Promise<PriceHistory> {
        await updateCoinPrices(this)
        this.#priceHistory = await PriceHistory.loadFromCsv(
            this.priceHistoryFilePath
        )

        return this.#priceHistory
    }
}

export const COINS: Record<string, Coin> = {
    bitcoin: new Coin({
        name: 'Bitcoin',
        symbol: 'BTC'
    }),
    ethereum: new Coin({
        name: 'Ethereum',
        symbol: 'ETH'
    })
}
