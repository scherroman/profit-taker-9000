```
    ____             _____ __      ______      __                ____  ____  ____  ____
   / __ \_________  / __(_) /_    /_  __/___ _/ /_____  _____   / __ \/ __ \/ __ \/ __ \
  / /_/ / ___/ __ \/ /_/ / __/_____/ / / __ `/ //_/ _ \/ ___/  / /_/ / / / / / / / / / /
 / ____/ /  / /_/ / __/ / /_/_____/ / / /_/ / ,< /  __/ /      \__, / /_/ / /_/ / /_/ /
/_/   /_/   \____/_/ /_/\__/     /_/  \__,_/_/|_|\___/_/      /____/\____/\____/\____/

```

Profit-Taker 9000 offers the ultimate insight you need to become a bona fide cryptolord. Backtest your strategy or let Profit-Taker 9000 reveal the _proper_ parameters you _should_ have used to have bought the bottom and sold the top. Put your trust in Profit-Taker 9000 and you'll be cruising in the lambo of your dreams in no time.

## Setup

**1. Download and open the repository**

```
git clone https://github.com/scherroman/profit-taker-9000
cd profit-taker-9000
```

**2. Install dependencies**

```
npm install
```

**3. Build the package**

```
npm run build
```

**4. Link the package globally**

```
npm link
```

## Usage

### Fetch coin price history

```
npx profit-taker-9000 fetch <symbol>
```

e.g.) `BTC` for Bitcoin, `ETH` for Ethereum

Prices are sourced from [CoinGecko](https://www.coingecko.com/)

### Built-in strategies

-   [Hodl](source/strategy/strategies/hodl.ts)
-   [BuyAndHodl](source/strategy/strategies/buyAndHodl.ts)
-   [NaiveGrid](source/strategy/strategies/naiveGrid.ts)
-   [OptimisticGrid](source/strategy/strategies/optimisticGrid.ts)
-   [CostBasisGrid](source/strategy/strategies/costBasisGrid.ts)

### Backtest a strategy

```
import { COINS, EXCHANGES, OptimisticGridStrategy } from 'profit-taker-9000'

async function main(): Promise<void> {
    let strategy = new OptimisticGridStrategy({
        coin: COINS.BITCOIN,
        buyThreshold: 50,
        sellThreshold: 100,
        buyPercentage: 25,
        sellPercentage: 50,
    })

    let results = await strategy.backtest({
        coinAmount: 1,
        cashAmount: 5000,
        startDate: new Date('2020-01-01'),
        exchange: EXCHANGES.COINBASE_PRO,
    })

    console.log(results.description)
}

main()
```

Output:

```
This strategy made a profit of $17,040.18, with a yield of 139.73%. That's a 2.4x!
This was better than simply hodling, which would have made a profit of $14,040.46 / 115.13% / 2.15x.
This was worse than simply buying and hodling, which would have made a profit of $23,748.56 / 195.14% / 2.95x.

Profit: $17,040.18 / 139.73% / 2.4x
 Value: $12,195.15 -> $29,235.34
Amount: 1 BTC / $5,000 -> 0.36255624 BTC / $21,536.23
 Price: $7,195.15/BTC -> $21,235.61/BTC
Trades: 4 trades (1 buys, 3 sells)
  Time: 2 years, 6 months, 26 days (December 31, 2019 to July 26, 2022)

Trades: [
  {
    type: 'Sell',
    amount: 0.5,
    price: 15553.331701081443,
    date: 2020-11-06T00:00:00.000Z
  },
  {
    type: 'Sell',
    amount: 0.25,
    price: 32163.824935335215,
    date: 2021-01-03T00:00:00.000Z
  },
  {
    type: 'Sell',
    amount: 0.125,
    price: 64517.64856042277,
    date: 2021-10-20T00:00:00.000Z
  },
  {
    type: 'Buy',
    amount: 0.23755623552831248,
    price: 30269.586956629482,
    date: 2022-05-10T00:00:00.000Z
  }
]
```

### Optimize a strategy

```
let results = await strategy.optimize({
    coinAmount: 1,
    cashAmount: 5000,
    startDate: new Date('2020-01-01'),
    exchange: EXCHANGES.COINBASE_PRO,
    parameterRanges: {
        buyThreshold: {
            minimum: 0,
            maximum: 100,
            step: 10,
        },
        sellThreshold: {
            minimum: 0,
            maximum: 10000,
            step: 10,
        },
        buyPercentage: {
            minimum: 0,
            maximum: 100,
            step: 10,
        },
        sellPercentage: {
            minimum: 0,
            maximum: 100,
            step: 10,
        },
    },
})

console.log(results.best.description)
```

Output:

```
Best:{
  sellPercentage: 100,
  buyPercentage: 100,
  sellThreshold: 830,
  buyThreshold: 70
}

This strategy made a profit of $67,986.18, with a yield of 557.49%. That's a 6.57x!
This was better than simply hodling, which would have made a profit of $14,040.46 / 115.13% / 2.15x.
This was better than simply buying and hodling, which would have made a profit of $23,748.56 / 195.14% / 2.95x.

Profit: $67,986.18 / 557.49% / 6.57x
 Value: $12,195.15 -> $80,181.33
Amount: 1 BTC / $5,000 -> 3.77571052 BTC / $1.81
 Price: $7,195.15/BTC -> $21,235.61/BTC
Trades: 2 trades (1 buys, 1 sells)
  Time: 2 years, 6 months, 26 days (December 31, 2019 to July 26, 2022)

Trades: [
  {
    type: 'Sell',
    amount: 1,
    price: 67617.0155448617,
    date: 2021-11-09T00:00:00.000Z
  },
  {
    type: 'Buy',
    amount: 3.775710516940373,
    price: 19047.41782828195,
    date: 2022-06-19T00:00:00.000Z
  }
]
```

### Visualize optimization results

If a strategy has two or less parameters, you can generate a plot to visualize profits against the parameters. The grid strategies currently use 4 parameters however, so they cannot be plotted.

```
await results.plot({ type: 'Surface', filePath: 'plot.html' })
await results.plot({ type: 'Scatter', filePath: 'plot.html' })
await results.plot({ type: 'Countour', filePath: 'plot.html' })
```

### Use a different coin

```
import { Coin } from 'profit-taker-9000'

let coin =  new Coin({name: 'Solana', symbol: 'SOL'})
```

### Create a custom strategy

To create a custom strategy, import and extend the `Strategy` or `Grid` abstract base classes and implement the required abstract properties and methods. See any of the [built-in strategies](#built-in-strategies) for examples.

## Testing

**Run linter**

```
npm run lint
```

**Run typechecker**

```
npm run typecheck
```

**Run all static checks (linter and typechecker)**

```
npm run staticcheck
```

**Run the test suite**

```
npm run test
```

## Building

**Build the project**

```
npm run build
```

Javascript output is placed in the `/build` folder

## Useful Commands

**Run a typescript script using import paths from `tsconfig.json`**

```
npx ts-node -r tsconfig-paths/register
```
