import jwt from "jsonwebtoken";

const secret = process.env.JWT_SECRET || "replace_with_secure_secret";

export function signToken(payload) {
  return jwt.sign(payload, secret, { expiresIn: process.env.JWT_EXPIRES_IN || "8h" });
}

export function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = header.slice(7);
  try {
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    return next();
  } catch (_error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden for this role" });
    }
    return next();
  };
}
