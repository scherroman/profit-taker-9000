import { Trade } from 'exchange'
import { Strategy, Parameter } from '../'

/**
 * A strategy that simply hodls through rain or shine
 */
export class HodlStrategy extends Strategy {
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
