import { Trade } from 'exchange'
import { Coin } from 'coin'
import { Strategy, Parameter } from 'strategy'

export class HodlStrategy extends Strategy {
    /**
     * @param coin - Coin to use
     */
    constructor({ coin }: { coin: Coin }) {
        super({ coin })
    }

    get parameters(): Parameter[] {
        return []
    }

    protected getTrades({
        coinAmount,
        cashAmount
    }: {
        coinAmount: number
        cashAmount: number
    }): {
        trades: Trade[]
        endingCoinAmount: number
        endingCashAmount: number
    } {
        return {
            trades: [],
            endingCoinAmount: coinAmount,
            endingCashAmount: cashAmount
        }
    }
}
