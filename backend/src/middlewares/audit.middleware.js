/**
 * Audit logging middleware for admin actions
 * Logs sensitive operations for security monitoring
 */

const auditLog = (action, details = {}) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    action,
    adminId: details.adminId || 'unknown',
    adminEmail: details.adminEmail || 'unknown',
    resource: details.resource || 'unknown',
    resourceId: details.resourceId || null,
    method: details.method || 'unknown',
    path: details.path || 'unknown',
    ip: details.ip || 'unknown',
    userAgent: details.userAgent || 'unknown',
  };

  // Log to console (in production, send to logging service)
  console.log(`🔒 [AUDIT] ${action}`, JSON.stringify(logEntry, null, 2));
  
  // In production, you would send this to:
  // - Database audit table
  // - Logging service (e.g., Winston, Pino)
  // - Security monitoring system
};

/**
 * Middleware to log admin actions
 */
const auditAdminAction = (action) => {
  return (req, res, next) => {
    // Log after response is sent (non-blocking)
    const originalSend = res.send;
    res.send = function(data) {
      if (res.statusCode < 400 && req.admin) {
        auditLog(action, {
          adminId: req.admin.id,
          adminEmail: req.admin.email,
          resource: req.params.resource || req.route?.path,
          resourceId: req.params.id || req.params.code || null,
          method: req.method,
          path: req.path,
          ip: req.ip || req.connection.remoteAddress,
          userAgent: req.headers['user-agent'] || 'unknown',
        });
      }
      return originalSend.call(this, data);
    };
    next();
  };
};

module.exports = {
  auditLog,
  auditAdminAction,
};

