export type TrafficStatus = "GREEN" | "YELLOW" | "RED";

export function getTrafficStatus(expectedQty: number, actualQty: number): TrafficStatus {
  if (!Number.isInteger(expectedQty) || expectedQty < 0) {
    throw new Error("Expected quantity must be a non-negative integer.");
  }
  if (!Number.isInteger(actualQty) || actualQty < 0) {
    throw new Error("Actual quantity must be a non-negative integer.");
  }

  if (actualQty === expectedQty) return "GREEN";
  if (actualQty > expectedQty) return "YELLOW";
  return "RED";
}

export function calculateWastagePct(actualFabric: number, expectedFabric: number) {
  if (!Number.isFinite(actualFabric) || actualFabric < 0) {
    throw new Error("Actual fabric must be a non-negative number.");
  }
  if (!Number.isFinite(expectedFabric) || expectedFabric <= 0) {
    throw new Error("Expected fabric must be greater than zero.");
  }

  return ((actualFabric - expectedFabric) / expectedFabric) * 100;
}

export function validatePositiveInteger(value: unknown, field: string) {
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value <= 0
  ) {
    throw new Error(`${field} must be a positive integer.`);
  }
}

export function validateNonNegativeNumber(value: unknown, field: string) {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < 0
  ) {
    throw new Error(`${field} must be a non-negative number.`);
  }
}
