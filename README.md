```
    ____             _____ __      ______      __                ____  ____  ____  ____
   / __ \_________  / __(_) /_    /_  __/___ _/ /_____  _____   / __ \/ __ \/ __ \/ __ \
  / /_/ / ___/ __ \/ /_/ / __/_____/ / / __ `/ //_/ _ \/ ___/  / /_/ / / / / / / / / / /
 / ____/ /  / /_/ / __/ / /_/_____/ / / /_/ / ,< /  __/ /      \__, / /_/ / /_/ / /_/ /
/_/   /_/   \____/_/ /_/\__/     /_/  \__,_/_/|_|\___/_/      /____/\____/\____/\____/

```

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

## Usage

**1. Create a `/scripts` folder**

```
mkdir scripts
```

**2. Add a script to the `/scripts` folder and run it**:

```
npm run run scripts/takeProfits.ts
```

## Testing

**Run linter**

```
npm run lint
```

**Run typechecker**

```
npm run typecheck
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
