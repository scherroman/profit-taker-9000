import { parseISO } from 'date-fns'
import {
    humanizeNumber,
    humanizeDate,
    humanizeDatetime,
    getCombinations
} from 'utilities'

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

let firstArray = [1, 2]
let secondArray = ['A', 'B']
let thirdArray = ['c', 'd']

describe('getPermutations', () => {
    it('returns permutations for an empty array successfully', () => {
        expect(getCombinations([])).toMatchObject([])
    })
    it('returns permutations for a single array successfully', () => {
        expect(getCombinations([firstArray])).toMatchObject([[1], [2]])
    })
    it('returns permutations for two arrays successfully', () => {
        expect(getCombinations([firstArray, secondArray])).toMatchObject([
            [1, 'A'],
            [1, 'B'],
            [2, 'A'],
            [2, 'B']
        ])
    })
    it('returns permutations for three arrays successfully', () => {
        expect(
            getCombinations([firstArray, secondArray, thirdArray])
        ).toMatchObject([
            [1, 'A', 'c'],
            [1, 'A', 'd'],
            [1, 'B', 'c'],
            [1, 'B', 'd'],
            [2, 'A', 'c'],
            [2, 'A', 'd'],
            [2, 'B', 'c'],
            [2, 'B', 'd']
        ])
    })
})
