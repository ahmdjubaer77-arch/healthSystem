function errorMiddleware(error, req, res, next) {
  const requestedStatusCode = Number(error.statusCode || error.status)
  const statusCode = Number.isInteger(requestedStatusCode)
    && requestedStatusCode >= 400
    && requestedStatusCode < 600
    ? requestedStatusCode
    : 500

  if (process.env.NODE_ENV !== 'production') {
    console.error(error)
  }

  const response = {
    success: false,
    message: statusCode >= 500 ? 'Something went wrong' : error.message || 'Something went wrong',
    data: null,
  }

  if (statusCode < 500 && error.code) response.code = error.code
  res.status(statusCode).json(response)
}

module.exports = errorMiddleware