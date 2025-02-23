# Pixelite

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.2.3. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.

---


## Usage
### Browser
```ts
import { pixelift } from 'pixelift'
const pixels = await pixelift('image.png')
```

### Node
```ts
import { pixelift } from 'pixelift'
const pixels = await pixelift(fs.readFileSync('image.jpg'), 'jpeg')
```

---

```
pixelift/
├── src/
│   ├── browser/       # Browser-specific implementations
│   ├── node/          # Node-specific implementations (with Sharp)
│   ├── shared/        # Common utilities/types
│   └── index.ts       # Main exports
├── test/
├── package.json
├── tsconfig.json
├── vite.config.ts
└── bun.lockb
```