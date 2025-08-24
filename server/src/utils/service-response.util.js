export class ServiceResponse {
  static success(data = null, message = "Operation successful") {
    return {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  static error(message = "Operation failed", error = null, statusCode = 500) {
    return {
      success: false,
      message,
      error: error?.message || error,
      statusCode,
      timestamp: new Date().toISOString(),
    };
  }

  static validationError(errors, message = "Validation failed") {
    return {
      success: false,
      message,
      errors,
      statusCode: 400,
      timestamp: new Date().toISOString(),
    };
  }

  static notFound(message = "Resource not found") {
    return {
      success: false,
      message,
      statusCode: 404,
      timestamp: new Date().toISOString(),
    };
  }

  static unauthorized(message = "Unauthorized access") {
    return {
      success: false,
      message,
      statusCode: 401,
      timestamp: new Date().toISOString(),
    };
  }

  static forbidden(message = "Forbidden access") {
    return {
      success: false,
      message,
      statusCode: 403,
      timestamp: new Date().toISOString(),
    };
  }
}
