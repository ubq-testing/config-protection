export function returnOptional<T>(value: T | undefined): T {
    if (!value) {
        throw new Error("Value is undefined");
    }
    return value;
}