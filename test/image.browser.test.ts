import { describe, expect, it } from "vitest";

describe("Browser Environment", () => {
  it("should run in a browser environment", () => {
    expect(window).toBeDefined();
  });
});
