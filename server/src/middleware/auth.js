function requireAuth(req, res, next) {
  if (!req.session?.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.session?.user) return res.status(401).json({ error: 'Authentication required' });
    if (!roles.includes(req.session.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    next();
  };
}

function requireOwnerOrPC(req, res, next) {
  const { user } = req.session;
  if (!user) return res.status(401).json({ error: 'Authentication required' });
  if (user.role === 'pc') return next();
  if (user.role === 'student' && user.registerNo === req.params.registerNo?.toUpperCase()) {
    return next();
  }
  return res.status(403).json({ error: 'Access denied' });
}

module.exports = { requireAuth, requireRole, requireOwnerOrPC };
