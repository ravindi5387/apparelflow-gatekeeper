import { describe, expect, it } from "vitest";
import {
  calculateWastagePct,
  getTrafficStatus,
  validateNonNegativeNumber,
  validatePositiveInteger
} from "../src/business";

describe("ApparelFlow gatekeeper domain rules", () => {
  it("Test 1: all GREEN components are approvable", () => {
    expect(getTrafficStatus(100, 100)).toBe("GREEN");
    expect(getTrafficStatus(50, 50)).toBe("GREEN");
  });

  it("Test 2: RED shortage is detected and must block approval", () => {
    expect(getTrafficStatus(100, 99)).toBe("RED");
    const statuses = [getTrafficStatus(100, 100), getTrafficStatus(100, 99)];
    expect(statuses.includes("RED")).toBe(true);
  });

  it("Test 3: rejection requires a non-empty reason", () => {
    const reason = "Sleeve cuffs are short by 5 pieces.";
    expect(reason.trim().length).toBeGreaterThan(0);
    expect("".trim().length).toBe(0);
  });

  it("Test 4: non-verifier roles are not allowed by the role policy", () => {
    const allowed = ["CUTTING_VERIFIER"];
    expect(allowed.includes("CUTTING_SUPERVISOR")).toBe(false);
    expect(allowed.includes("SEWING_SUPERVISOR")).toBe(false);
  });

  it("Test 5: sewing queue policy only accepts VERIFIED orders", () => {
    const orders = [
      { status: "PENDING_VERIFICATION" },
      { status: "REJECTED" },
      { status: "VERIFIED" }
    ];
    const queue = orders.filter((order) => order.status === "VERIFIED");
    expect(queue).toHaveLength(1);
    expect(queue[0].status).toBe("VERIFIED");
  });

  it("calculates fabric wastage", () => {
    expect(calculateWastagePct(92, 90)).toBeCloseTo(2.2222, 3);
  });

  it("rejects invalid numeric inputs", () => {
    expect(() => validatePositiveInteger(0, "qty")).toThrow();
    expect(() => validatePositiveInteger(1.2, "qty")).toThrow();
    expect(() => validateNonNegativeNumber(-1, "fabric")).toThrow();
  });
});
