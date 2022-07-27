import yargs, { Argv, ArgumentsCamelCase } from 'yargs'
import { hideBin } from 'yargs/helpers'

import { Coin, updateCoinPrices } from 'coin'

yargs(hideBin(process.argv))
    .command(
        'update <symbol>',
        'Update prices for a coin',
        (args: Argv) => {
            args.positional('symbol', {
                describe: 'Symbol for the coin. e.g.) BTC for bitcoin'
            })
        },
        async ({ symbol }: ArgumentsCamelCase<{ symbol: string }>) => {
            console.log(`Checking prices for ${symbol}...`)
            let prices = await updateCoinPrices(
                new Coin({ name: symbol, symbol })
            )
            if (prices.length === 0) {
                console.log('Prices are up to date.')
            } else {
                console.log(
                    `Updated prices for the last ${prices.length} days!`
                )
            }
        }
    )
    .demandCommand()
    .parse()
