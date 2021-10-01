import { format } from 'date-fns'

export interface Range {
    minimum: number
    maximum: number
    step: number
}

export function round(number: number, digits: number): number {
    let factor = Math.pow(10, digits)
    return Math.round(number * factor) / factor
}

export function humanizeNumber(number: number, maxDecimalPlaces = 2): string {
    return parseFloat(number.toFixed(maxDecimalPlaces)).toLocaleString(
        undefined,
        {
            maximumFractionDigits: maxDecimalPlaces
        }
    )
}

export function humanizeDate(date: Date): string {
    return format(date, 'MMMM d, yyyy')
}

export function humanizeDatetime(date: Date): string {
    return format(date, 'h:mm a MMMM d, yyyy')
}

export function getCombinations<Type>(arrays: Type[][]): Type[][] {
    if (arrays.length === 0) {
        return []
    }

    let combinations = []
    let [firstArray, ...remainingArrays] = arrays

    for (let item of firstArray) {
        let subcombinations = getCombinations(remainingArrays)
        if (subcombinations.length === 0) {
            combinations.push([item])
        } else {
            for (let subcombination of subcombinations) {
                combinations.push([item, ...subcombination])
            }
        }
    }

    return combinations
}

export function getRangeCombinations(
    items: Record<string, Range>
): Record<string, number>[] {
    let parametersArray = []

    for (let [key, { minimum, maximum, step }] of Object.entries(items)) {
        let possibleParameterValues = getRange({
            start: minimum,
            end: maximum,
            step
        })
        parametersArray.push(
            Array.from(possibleParameterValues, (value) => ({
                [key]: value
            }))
        )
    }

    let combinations = getCombinations(parametersArray)
    let formattedCombinations = []
    for (let combination of combinations) {
        let formattedCombination = {}
        for (let item of combination) {
            formattedCombination = { ...item, ...formattedCombination }
        }
        formattedCombinations.push(formattedCombination)
    }

    return formattedCombinations
}

export function getRange({
    start,
    end,
    step
}: {
    start: number
    end: number
    step: number
}): number[] {
    if (start > end) {
        throw new Error('Start must be less than or equal to end')
    } else if (step <= 0) {
        throw new Error('Step must be greater than zero')
    }

    let numberOfDecimals = countDecimals(step)
    let scale = 10 ** numberOfDecimals
    let scaledStart = start * scale
    let scaledEnd = end * scale
    let scaledStep = step * scale

    let range = []
    for (let item = scaledStart; item <= scaledEnd; item += scaledStep) {
        range.push(item / scale)
    }

    return range
}

export function countDecimals(value: number): number {
    if (Math.floor(value) === value) return 0
    return value.toString().split('.')[1].length || 0
}
