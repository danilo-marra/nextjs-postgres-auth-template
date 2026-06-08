export class InternalServerError extends Error {
  name: string;
  action: string;
  statusCode: number;

  constructor({ cause, statusCode }: { cause?: unknown; statusCode?: number }) {
    super("An unexpected internal error occurred.", { cause });
    this.name = "InternalServerError";
    this.action = "Contact support.";
    this.statusCode = statusCode ?? 500;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.statusCode,
    };
  }
}

export class ServiceError extends Error {
  name: string;
  action: string;
  statusCode: number;
  context: unknown;

  constructor({
    cause,
    message,
    action,
    context,
  }: {
    cause?: unknown;
    message?: string;
    action?: string;
    context?: unknown;
  }) {
    super(message ?? "Service unavailable.", { cause });
    this.name = "ServiceError";
    this.action = action ?? "Check if the service is available.";
    this.statusCode = 503;
    this.context = context;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.statusCode,
      context: this.context,
    };
  }
}

export class ValidationError extends Error {
  name: string;
  action: string;
  statusCode: number;

  constructor({
    cause,
    message,
    action,
  }: {
    cause?: unknown;
    message?: string;
    action?: string;
  }) {
    super(message ?? "A validation error occurred.", { cause });
    this.name = "ValidationError";
    this.action = action ?? "Correct the data and try again.";
    this.statusCode = 400;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.statusCode,
    };
  }
}

export class NotFoundError extends Error {
  name: string;
  action: string;
  statusCode: number;

  constructor({
    cause,
    message,
    action,
  }: {
    cause?: unknown;
    message?: string;
    action?: string;
  }) {
    super(message ?? "This resource could not be found.", { cause });
    this.name = "NotFoundError";
    this.action = action ?? "Check if the query parameters are correct.";
    this.statusCode = 404;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.statusCode,
    };
  }
}

export class UnauthorizedError extends Error {
  name: string;
  action: string;
  statusCode: number;

  constructor({
    cause,
    message,
    action,
  }: {
    cause?: unknown;
    message?: string;
    action?: string;
  }) {
    super(message ?? "User not authenticated.", { cause });
    this.name = "UnauthorizedError";
    this.action = action ?? "Log in again to continue.";
    this.statusCode = 401;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.statusCode,
    };
  }
}

export class ForbiddenError extends Error {
  name: string;
  action: string;
  statusCode: number;

  constructor({
    cause,
    message,
    action,
  }: {
    cause?: unknown;
    message?: string;
    action?: string;
  }) {
    super(message ?? "Access denied.", { cause });
    this.name = "ForbiddenError";
    this.action = action ?? "Check the required features before continuing.";
    this.statusCode = 403;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.statusCode,
    };
  }
}

export class MethodNotAllowedError extends Error {
  name: string;
  action: string;
  statusCode: number;

  constructor() {
    super("Method not allowed for this endpoint.");
    this.name = "MethodNotAllowedError";
    this.action = "Check if the HTTP method used is valid for this endpoint.";
    this.statusCode = 405;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.statusCode,
    };
  }
}
