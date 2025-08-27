export function errorHandler(err, req, res, _next) {
  const status = err.status || 500;
  res.status(status).json({
    ok: false,
    code: err.code || 'INTERNAL_ERROR',
    message: err.message,
    requestId: req.id,
  });
}
