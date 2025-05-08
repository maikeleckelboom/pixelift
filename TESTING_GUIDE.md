# Testing Guide

A concise but comprehensive overview of Pixelift's testing strategy, project structure, commands, and best practices. This guide helps maintainers and contributors write, run, and extend tests efficiently.

---

## 🧩 Overview

Pixelift uses a unified testing framework powered by [Vitest](https://vitest.dev/) for both browser and server environments, supplemented by Bun for fast execution. Our test suite covers:

* **Unit tests** for validating functionality.
* **Benchmark tests** to monitor and improve performance.
* **Snapshot tests** for regression safety.

---

## 🚀 Quick Start

```bash
# Install dependencies (including dev dependencies)
npm install

# Run all tests (unit, snapshot, benchmarks) via Vitest
npm test

# Generate snapshots
npm test:update

# Run all tests in CI mode (no snapshot writing)
npm test:ci

# Run all tests in watch mode (re-run on file changes)
npm run dev
```

---

## 🗂️ Test Architecture

```
test/
├── browser/            # Browser-specific tests
│   ├── benchmarks/     # Performance tests (e.g., decoder.bench.ts)
│   └── unit/           # Pixelift browser module tests
├── server/             # Node.js server tests
│   ├── benchmarks/     # Server performance benchmarks
│   └── unit/           # Pixelift server module tests
└── shared/             # Cross-environment tests
    └── unit/           # Shared utility function tests
```

* **Fixtures** are stored alongside tests in `__fixtures__` folders, with snapshots under `__snapshots__`.
* Tests in **shared** ensure parity across environments.

---

## 💻 Commands Matrix

| Category         | Command                  | Description                                     |
|------------------|--------------------------|-------------------------------------------------|
| **All Tests**    | `npm test`<br>`bun test` | Run all tests (unit + snapshots + benchmarks)   |
| **Browser Only** | `bun test:browser`       | Run only browser unit tests                     |
| **Server Only**  | `bun test:server`        | Run only server unit tests                      |
| **Benchmarks**   | `bun bench`              | Run all performance tests                       |
| **Browser**      | `bun bench:browser`      | Browser benchmarks                              |
| **Server**       | `bun bench:server`       | Server benchmarks                               |
| **Snapshots**    | `bun test:update`        | Update snapshot files after intentional changes |
| **CI Mode**      | `bun test:ci`            | CI-friendly run (no snapshot writing)           |
| **Watch Mode**   | `bun dev`                | Watch files and rerun relevant tests            |

---

## 🛠️ Adding New Tests

1. Create a new test file under the appropriate folder (`browser`, `server`, or `shared`).
2. Place any sample assets in `__fixtures__` alongside your test.
3. Write tests using Vitest syntax:

   ```ts
   import { describe, it, expect } from 'vitest';
   import { pixelift } from '../../src';

   describe('My new feature', () => {
     it('decodes correctly', async () => {
       const { width, height, data } = await pixelift('path/to/fixture.png');
       expect(width).toBe(100);
       expect(data).toHaveLength(width * height * 4);
     });
   });
   ```
4. Run `npm test` to ensure tests pass.

---

## 📊 Benchmark Guidelines

* Benchmarks live alongside unit tests in `benchmarks/`.
* Use Vitest's `bench` API for micro-benchmarks:

  ```ts
  import { bench } from 'vitest';
  bench('decode performance', async () => {
    await pixelift(fixtureBuffer);
  });
  ```
* Avoid DOM interactions in benchmarks; use raw buffers or offscreen canvases.

---

## 🔍 Troubleshooting

* **Slow tests**: Identify bottlenecks via isolated benchmarks.
* **Flaky snapshots**: Ensure binary assets are consistent and use stable encoding options.
* **CI failures**: Check `bun test:ci` logs for missing snapshot updates or environment mismatches.

---

## 📖 Further Reading

* [Vitest Documentation](https://vitest.dev/guide/)
* [Bun Test Runner](https://bun.sh/docs/cli/test)
* [Snapshot Testing Best Practices](https://kentcdodds.com/blog/consistent-snapshot-testing)

---

*Last updated: May 8, 2025*
