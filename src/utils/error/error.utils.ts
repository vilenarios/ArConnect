export function isError(data: unknown): data is Error {
  return data instanceof Error;
}

export enum ErrorTypes {
  Error = "Error",
  RangeError = "RangeError",
  ReferenceError = "ReferenceError",
  SyntaxError = "SyntaxError",
  URIError = "URIError",
  PageNotFound = "Page not found",
  SettingsTypeNotFound = "Settings type not found",
  SettingsNotFound = "Settings not found",
  WalletNotFound = "Wallet not found",
  TokenNotFound = "Token not found",
  TxIdNotFound = "Transaction ID not found"
}
