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

const conCodigo = (statusCode) =>
  class extends AppError {
    constructor(message, details) {
      super(message, statusCode, details);
    }
  };

export class BadRequestError extends conCodigo(400) {}
export class UnauthorizedError extends conCodigo(401) {}
export class ForbiddenError extends conCodigo(403) {}
export class NotFoundError extends conCodigo(404) {}
export class ConflictError extends conCodigo(409) {}
export class UnprocessableEntityError extends conCodigo(422) {}
export class ServiceUnavailableError extends conCodigo(503) {}
