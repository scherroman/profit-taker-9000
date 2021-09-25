import { parseISO } from 'date-fns'
import {
    round,
    humanizeNumber,
    humanizeDate,
    humanizeDatetime,
    getCombinations,
    getRangeCombinations,
    getRange,
    countDecimals
} from 'utilities'

describe('round', () => {
    it('rounds a decimal to a specific number of decimal places', () => {
        expect(round(1.126, 3)).toBe(1.126)
    })
    it('rounds down properly', () => {
        expect(round(1.123, 2)).toBe(1.12)
    })
    it('rounds up properly', () => {
        expect(round(1.126, 2)).toBe(1.13)
    })
    it('fixes floating point arithmentic sillyness', () => {
        expect(round(110.00000000000001, 2)).toBe(110)
        expect(round(110.00000000000001, 3)).toBe(110)
    })
    it("doesn't affect integers or decimals with less digits", () => {
        expect(round(110.0, 2)).toBe(110)
        expect(round(110.0, 3)).toBe(110)
        expect(round(110, 2)).toBe(110)
        expect(round(110, 2)).toBe(110)
    })
})

describe('humanizeNumber', () => {
    it('humanizes a number to a human-readable format: two decimal places with commas', () => {
        expect(humanizeNumber(2012930.109833492494)).toBe('2,012,930.11')
        expect(humanizeNumber(2012930.1)).toBe('2,012,930.1')
        expect(humanizeNumber(2012930)).toBe('2,012,930')
        expect(humanizeNumber(10)).toBe('10')
    })
    it('uses the decimal places provided', () => {
        expect(humanizeNumber(2012930.109833492494, 5)).toBe('2,012,930.10983')
    })
})

describe('humanizeDate', () => {
    it('humanizes a date to a human-readable format', () => {
        expect(humanizeDate(parseISO('2013-01-01'))).toBe('January 1, 2013')
        expect(humanizeDate(parseISO('2013-12-31'))).toBe('December 31, 2013')
    })
})

describe('humanizeDatetime', () => {
    it('humanizes a datetime to a human-readable format', () => {
        expect(humanizeDatetime(parseISO('2013-01-01'))).toBe(
            '12:00 AM January 1, 2013'
        )
        expect(humanizeDatetime(parseISO('2013-12-31'))).toBe(
            '12:00 AM December 31, 2013'
        )
    })
})

let firstArray = ['1', '2']
let secondArray = ['A', 'B']
let thirdArray = ['c', 'd']

describe('getCombinations', () => {
    it('returns combinations for an empty array successfully', () => {
        expect(getCombinations([])).toMatchObject([])
    })
    it('returns combinations for a single array successfully', () => {
        expect(getCombinations([firstArray])).toMatchObject([['1'], ['2']])
    })
    it('returns combinations for two arrays successfully', () => {
        expect(getCombinations([firstArray, secondArray])).toMatchObject([
            ['1', 'A'],
            ['1', 'B'],
            ['2', 'A'],
            ['2', 'B']
        ])
    })
    it('returns combinations for three arrays successfully', () => {
        expect(
            getCombinations([firstArray, secondArray, thirdArray])
        ).toMatchObject([
            ['1', 'A', 'c'],
            ['1', 'A', 'd'],
            ['1', 'B', 'c'],
            ['1', 'B', 'd'],
            ['2', 'A', 'c'],
            ['2', 'A', 'd'],
            ['2', 'B', 'c'],
            ['2', 'B', 'd']
        ])
    })
})

describe('getRange', () => {
    it('generates a range of integers between two numbers', () => {
        expect(getRange({ start: 1, end: 5, step: 1 })).toMatchObject([
            1, 2, 3, 4, 5
        ])
    })
    it('generates a range of decimals between two numbers', () => {
        expect(getRange({ start: 0.1, end: 0.3, step: 0.1 })).toMatchObject([
            0.1, 0.2, 0.3
        ])
    })
    it('handles a single number properly', () => {
        expect(getRange({ start: 2, end: 2, step: 5 })).toMatchObject([2])
    })
    it('throws an error if step is zero or negative', () => {
        expect(() => getRange({ start: 1, end: 2, step: 0 })).toThrow(TypeError)
        expect(() => getRange({ start: 1, end: 2, step: -1 })).toThrow(
            TypeError
        )
    })
    it('throws an error if the start is after end', () => {
        expect(() => getRange({ start: 2, end: 1, step: 1 })).toThrow(TypeError)
    })
})

let parameters = {
    a: {
        minimum: 1,
        maximum: 2,
        step: 1
    },
    b: {
        minimum: 10,
        maximum: 16,
        step: 2
    }
}

describe('getRangeCombinations', () => {
    it('returns combinations for a range of numbers', () => {
        expect(getRangeCombinations(parameters)).toMatchObject([
            { a: 1, b: 10 },
            { a: 1, b: 12 },
            { a: 1, b: 14 },
            { a: 1, b: 16 },
            { a: 2, b: 10 },
            { a: 2, b: 12 },
            { a: 2, b: 14 },
            { a: 2, b: 16 }
        ])
    })
})

describe('countDecimals', () => {
    it('counts decimals properly', () => {
        expect(countDecimals(0.1)).toBe(1)
        expect(countDecimals(0.01)).toBe(2)
        expect(countDecimals(0.001)).toBe(3)
        expect(countDecimals(1)).toBe(0)
    })
})
