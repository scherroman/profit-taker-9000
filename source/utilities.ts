import { format } from 'date-fns'

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

export function getCombinations(arrays: unknown[][]): unknown[][] {
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
