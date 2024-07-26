export function returnOptional<T>(value: T | undefined | null): T {
  if (!value) {
    throw new Error("Value is undefined");
  }
  return value;
}
