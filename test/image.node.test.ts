import { describe, it, expect } from "vitest";

describe("Node Environment", () => {
  it("should run in a node environment", () => {
    expect(global).toBeDefined();
  });
});
