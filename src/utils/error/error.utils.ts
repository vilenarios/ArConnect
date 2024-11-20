export function isError(data: unknown): data is Error {
  return data instanceof Error;
}
