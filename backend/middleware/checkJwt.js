
const jwt = require('jsonwebtoken');

module.exports = (roles = []) => {
  return (req, res, next) => {
    const auth = req.headers.authorization;
    const token = auth && auth.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Token requerido' });

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (roles.length && !roles.includes(decoded.role)) {
        return res.status(403).json({ error: 'No autorizado' });
      }
      req.user = decoded;
      next();
    } catch {
      res.status(401).json({ error: 'Token inválido' });
    }
  };
};
