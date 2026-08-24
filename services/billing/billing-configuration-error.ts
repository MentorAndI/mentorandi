export class BillingConfigurationError extends Error {
  readonly statusCode = 503;

  constructor(message: string) {
    super(message);
    this.name = "BillingConfigurationError";
  }
}
