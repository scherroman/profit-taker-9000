import fs from 'fs'
import { Range } from 'utilities'

import { BacktestInput, BacktestResults } from './backtest'

export interface OptimizeInput extends BacktestInput {
    parameterRanges: Record<string, Range>
}

/**
 * Crunches all possible outcomes of a strategy given a set of parameter ranges
 */
export class OptimizationResults {
    all: ParameterBacktestResults[]
    unsorted: ParameterBacktestResults[]
    parameters: Parameter[]
    parameterRanges: Record<string, Range>

    /**
     * @param results - Results of backtesting all parameter combinations
     * @param parameters - Parameter definitions from the strategy
     * @param parameterRanges - Range of possible values for each parameter
     */
    constructor({
        results,
        parameters,
        parameterRanges
    }: {
        results: ParameterBacktestResults[]
        parameters: Parameter[]
        parameterRanges: Record<string, Range>
    }) {
        this.unsorted = results
        this.all = [...results].sort((a, b) =>
            b.backtestResults.profit > a.backtestResults.profit ? 1 : -1
        )
        this.parameters = parameters
        this.parameterRanges = parameterRanges
    }

    get best(): ParameterBacktestResults {
        return this.all[0]
    }

    get worst(): ParameterBacktestResults {
        return this.all[this.all.length - 1]
    }

    /**
     * Outputs a viewable plot as an html file
     * @param type - Type of plot to make
     * @param filePath - Path to output the file to
     */
    plot({
        type,
        filePath = 'plot.html'
    }: {
        type: string
        filePath?: string
    }): void {
        let { data, layout } = this.getPlotData({ type })
        let html = `
        <head>
            <script src="https://cdn.plot.ly/plotly-2.4.2.min.js"></script>
        </head>
        <body>
            <div id="visualization" style="width:100%;height:100%;"></div>
            <script>
                visualization = document.getElementById('visualization');
                Plotly.newPlot( visualization, [${JSON.stringify(
                    data
                )}], ${JSON.stringify(layout)});
            </script>
        </body>
        `

        fs.writeFileSync(filePath, html)
    }

    getPlotData({ type }: { type: string }): {
        data: PlotData
        layout: PlotLayout
    } {
        let plotType = PlotType[type as keyof typeof PlotType]

        if (!plotType) {
            throw new Error(`Plot type ${type} does not exist`)
        }

        if (!this.#isPlotTypeSupported(plotType)) {
            throw new Error(
                `Plot type ${type} is not supported for ${this.parameters.length} parameters`
            )
        }

        let data
        if (
            plotType === PlotType.Contour ||
            plotType === PlotType.Surface ||
            plotType === PlotType.Scatter
        ) {
            data = this.get3dPlotData({ type })
        } else {
            throw new Error(`Plot type ${type} not yet supported`)
        }

        let parameterNames = Object.keys(this.parameterRanges)
        let [firstParameterName, secondParameterName] = parameterNames
        let layout = {
            scene: {
                xaxis: {
                    title: firstParameterName
                },
                yaxis: {
                    title: secondParameterName
                },
                zaxis: {
                    title: 'profit'
                }
            }
        }

        return { data, layout }
    }

    get3dPlotData({ type }: { type: string }): PlotData {
        return type === PlotType.Scatter
            ? this.#getScatter3dData()
            : this.#getBasic3dData({ type })
    }

    /** Use for surface and contour graphs */
    #getBasic3dData({ type }: { type: string }): Basic3dData {
        let [firstParameter, secondParameter] = this.parameters
        return {
            x: this.#getAllParameterValues({
                parameterName: firstParameter.name,
                uniquely: true
            }),
            y: this.#getAllParameterValues({
                parameterName: secondParameter.name,
                uniquely: true
            }),
            z: this.#getzValues({
                parameters: this.parameters,
                results: this.unsorted
            }),
            type: type.toLowerCase(),
            hovertemplate: this.#buildHoverTemplate(this.parameters)
        }
    }

    #getScatter3dData(): Scatter3dData {
        let [firstParameter, secondParameter] = this.parameters
        let zValues = this.unsorted.map(
            ({ backtestResults }) => backtestResults.profit
        )
        return {
            x: this.#getAllParameterValues({
                parameterName: firstParameter.name
            }),
            y: this.#getAllParameterValues({
                parameterName: secondParameter.name
            }),
            z: zValues,
            type: 'scatter3d',
            mode: 'markers',
            marker: {
                color: zValues
            },
            hovertemplate: this.#buildHoverTemplate(this.parameters)
        }
    }

    #getAllParameterValues({
        parameterName,
        uniquely = false
    }: {
        parameterName: string
        uniquely?: boolean
    }): number[] {
        let parameterValues = this.unsorted.map(
            ({ parameterValues }) => parameterValues[parameterName]
        )

        if (uniquely) {
            parameterValues = [...new Set(parameterValues)]
        }

        return parameterValues
    }

    #getzValues({
        parameters,
        results
    }: {
        parameters: Parameter[]
        results: ParameterBacktestResults[]
    }): number[][] {
        let [firstParameter] = parameters
        let zValues = []

        let zValuesForxValue = []
        let previousxValue = null
        for (let [index, result] of results.entries()) {
            let xValue = result.parameterValues[firstParameter.name]
            if (xValue !== previousxValue) {
                if (index !== 0) {
                    zValues.push(zValuesForxValue)
                    zValuesForxValue = []
                }
                previousxValue = xValue
            }
            zValuesForxValue.push(result.backtestResults.profit)
        }
        zValues.push(zValuesForxValue)

        return zValues
    }

    #buildHoverTemplate(parameters: Parameter[]): string {
        let template = ''
        let variablesForIndexes: Record<number, string> = {
            0: 'x',
            1: 'y'
        }
        for (let [index, parameter] of parameters.entries()) {
            let variableForIndex = variablesForIndexes[index]
            if (index !== 0) {
                template += `<br>`
            }
            template += `${parameter.name}: ${
                parameter.symbol.position === SymbolPosition.Prefix
                    ? parameter.symbol.symbol
                    : ''
            }%{${variableForIndex}:,}${
                parameter.symbol.position === SymbolPosition.Suffix
                    ? parameter.symbol.symbol
                    : ''
            }`
        }
        template += `<br>profit: $%{z:,.2f}`

        return template
    }

    #isPlotTypeSupported(type: PlotType): boolean {
        switch (type) {
            case PlotType.Contour: {
                return this.parameters.length === 2
            }
            case PlotType.Surface: {
                return this.parameters.length === 2
            }
            case PlotType.Scatter: {
                return this.parameters.length === 2
            }
            default: {
                return false
            }
        }
    }
}

export interface Parameter {
    name: string
    symbol: {
        symbol: string
        position: SymbolPosition
    }
}

export enum SymbolPosition {
    Prefix = 'Prefix',
    Suffix = 'Suffix'
}

interface ParameterBacktestResults {
    parameterValues: Record<string, number>
    backtestResults: BacktestResults
}

export enum PlotType {
    Contour = 'Countour',
    Surface = 'Surface',
    Scatter = 'Scatter'
}

type PlotData = Basic3dData | Scatter3dData

interface PlotDataBase {
    x: number[]
    y: number[]
    type: string
    mode?: string
    hovertemplate?: string
}

interface Basic3dData extends PlotDataBase {
    z: number[][]
}

interface Scatter3dData extends PlotDataBase {
    z: number[]
    marker: {
        color: number[]
    }
}

interface PlotLayout {
    scene?: {
        xaxis?: {
            title?: string
        }
        yaxis?: {
            title?: string
        }
        zaxis?: {
            title?: string
        }
    }
}