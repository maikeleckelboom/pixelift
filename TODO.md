## 📋 Project TODOs

This section tracks the upcoming improvements and testing strategies necessary to ensure consistent decoding and reliable pixel-data validation across environments.


### 2. Pixel Data Testing with Vitest Snapshots

Use Vitest’s snapshot feature to compare rendered pixel data against a known source of truth.

#### 2.1. Generating Snapshots
- Create a test suite that generates pixel data from a known image.
- Use Vitest’s snapshot feature to save the pixel data as a reference.

#### 2.2. Validating Pixel Data
- Create a test suite that loads the saved pixel data and compares it against the generated pixel data.
- Use Vitest’s snapshot feature to validate the pixel data.