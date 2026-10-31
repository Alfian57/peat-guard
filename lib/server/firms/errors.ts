export class FirmsProviderError extends Error {
  constructor(readonly code: string) {
    super("NASA FIRMS could not provide a valid hotspot response.");
    this.name = "FirmsProviderError";
  }
}
