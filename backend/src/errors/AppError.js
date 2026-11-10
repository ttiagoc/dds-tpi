export class AppError extends Error {
  constructor(message, statusCode, details) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.status = statusCode >= 500 ? "error" : "fail";
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

export class BadRequestError extends AppError {
  constructor(message, details) {
    super(message, 400, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message, details) {
    super(message, 401, details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message, details) {
    super(message, 403, details);
  }
}

export class NotFoundError extends AppError {
  constructor(message, details) {
    super(message, 404, details);
  }
}

export class ConflictError extends AppError {
  constructor(message, details) {
    super(message, 409, details);
  }
}

export class UnprocessableEntityError extends AppError {
  constructor(message, details) {
    super(message, 422, details);
  }
}
