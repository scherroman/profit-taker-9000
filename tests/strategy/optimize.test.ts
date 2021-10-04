import { COINS, PriceHistory } from 'coin'
import { EXCHANGES, TradeType } from 'exchange'
import { BacktestResults, OptimizationResults, SymbolPosition } from 'strategy'

let backtestResults = new BacktestResults({
    coin: COINS.bitcoin,
    startingCoinAmount: 1,
    startingCashAmount: 1000,
    endingCoinAmount: 0.5,
    endingCashAmount: 1100,
    trades: [
        {
            type: TradeType.Sell,
            amount: 0.5,
            price: 200,
            date: new Date(2013, 6, 1)
        }
    ],
    priceHistory: new PriceHistory({
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
    }),
    exchange: EXCHANGES.free
})

let optimizationResults = new OptimizationResults({
    results: [
        {
            parameterValues: { tradeThreshold: 0, tradePercentage: 0 },
            backtestResults: backtestResults
        },
        {
            parameterValues: { tradeThreshold: 0, tradePercentage: 10 },
            backtestResults: backtestResults
        },
        {
            parameterValues: { tradeThreshold: 1, tradePercentage: 0 },
            backtestResults: backtestResults
        },
        {
            parameterValues: { tradeThreshold: 1, tradePercentage: 10 },
            backtestResults: backtestResults
        },
        {
            parameterValues: { tradeThreshold: 2, tradePercentage: 0 },
            backtestResults: backtestResults
        },
        {
            parameterValues: { tradeThreshold: 2, tradePercentage: 10 },
            backtestResults: backtestResults
        }
    ],
    parameters: [
        {
            name: 'tradeThreshold',
            minimum: 0,
            symbol: { symbol: '%', position: SymbolPosition.Suffix }
        },
        {
            name: 'tradePercentage',
            minimum: 0,
            maximum: 100,
            symbol: { symbol: '%', position: SymbolPosition.Suffix }
        }
    ],
    parameterRanges: {
        tradeThreshold: {
            minimum: 0,
            maximum: 2,
            step: 1
        },
        tradePercentage: {
            minimum: 0,
            maximum: 10,
            step: 10
        }
    }
})

let plot3dData = {
    x: [0, 1, 2],
    y: [0, 10],
    z: [
        [150, 150],
        [150, 150],
        [150, 150]
    ]
}

let scatterPlot3dData = {
    x: [0, 0, 1, 1, 2, 2],
    y: [0, 10, 0, 10, 0, 10],
    z: [150, 150, 150, 150, 150, 150]
}

describe('OptimizationResults.get3dPlotData', () => {
    it('generates countour plot data', () => {
        expect(
            optimizationResults.get3dPlotData({ type: 'Contour' })
        ).toMatchObject(plot3dData)
    })
    it('generates 3d surface plot data', () => {
        expect(
            optimizationResults.get3dPlotData({ type: 'Surface' })
        ).toMatchObject(plot3dData)
    })
    it('generates 3d scatter plot data', () => {
        expect(
            optimizationResults.get3dPlotData({ type: 'Scatter' })
        ).toMatchObject(scatterPlot3dData)
    })
})
