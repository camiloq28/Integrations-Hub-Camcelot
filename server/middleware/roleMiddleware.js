// /server/middleware/roleMiddleware.js

function hasRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: Insufficient role' });
    }
    next();
  };
}

function isSameOrgOrAdmin(req, res, next) {
  const isAdmin = req.user.role === 'admin';
  const targetOrgId = req.body.orgId || req.params.orgId;

  if (isAdmin || (req.user.orgId?.toString() === targetOrgId)) {
    return next();
  }

  return res.status(403).json({ message: 'Forbidden: Cross-org access denied' });
}

module.exports = {
  hasRole,
  isSameOrgOrAdmin
};
