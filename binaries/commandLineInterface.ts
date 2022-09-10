import yargs, { Argv, ArgumentsCamelCase } from 'yargs'
import { hideBin } from 'yargs/helpers'

import { Coin } from 'coin'

void yargs(hideBin(process.argv))
    .command(
        'fetch <symbol>',
        'Fetches the price history for a coin',
        (args: Argv) => {
            args.positional('symbol', {
                describe: 'Symbol for the coin. e.g.) BTC for bitcoin'
            })
        },
        async ({ symbol }: ArgumentsCamelCase<{ symbol: string }>) => {
            console.log(`Checking price history for ${symbol}...`)
            let prices = await new Coin({
                name: symbol,
                symbol
            }).updatePriceHistory()

            if (prices.length === 0) {
                console.log('Prices are up to date.')
            } else {
                console.log(
                    `Fetched prices for the last ${prices.length} days.`
                )
            }
        }
    )
    .demandCommand()
    .parse()
