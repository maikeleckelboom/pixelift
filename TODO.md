## 📋 Project TODOs

This section tracks the upcoming improvements and testing strategies necessary to ensure consistent decoding and reliable pixel-data validation across environments.

### 1. Decoder Strategy Configuration

* **Current Default:** `webCodecs`
* **Target Default:** `offscreenCanvas`

   1. Update configuration files or code initializer to switch default decoder to `offscreenCanvas`.
   2. Validate fallback behavior in unsupported browsers.
   3. Document any performance differences or limitations.

### 2. Pixel Data Testing with Vitest Snapshots

Use Vitest’s snapshot feature to compare rendered pixel data against a known source of truth.

#### 2.1. Generating Snapshots

1. Run the snapshot update script:

   ```bash
   # If using Bun
   bun run test:update
   # Or with npm
   npm run test:update
   ```
2. Locate the generated files in `__snapshots__/`.
3. Verify that each snapshot accurately represents the expected rendering.
4. Commit snapshots to version control as the baseline for future tests.

#### 2.2. Writing Snapshot Tests

1. Import your rendering output in the test file:

   ```ts
   import { renderFrame } from '../src/decoder';
   ```
2. Write assertions using Vitest:

   ```ts
   test('renders frame consistently', () => {
     const data = renderFrame(...);
     expect(data).toMatchSnapshot();
   });
   ```
3. Ensure tests run in headless environments (CI) and compare pixel data to committed snapshots.
4. On failure, review diffed snapshot and:

   * If the change is legitimate, re-run `test:update` and commit updated snapshots.
   * If unexpected, investigate decoder or rendering pipeline issues.

### 3. Cross-Platform Consistency Checks

* Run tests on multiple platforms (Windows, macOS, Linux) to confirm pixel-level consistency.
* Automate tests in CI pipelines with Docker images or Matrix builds.
* Document any platform-specific quirks and resolutions.

---

**Next Steps:**

* Review and merge configuration change for decoder strategy.
* Finalize initial snapshot set and commit.
* Integrate cross-platform CI tests.
* Update documentation with troubleshooting tips and known issues.
