const jwt = require("jsonwebtoken");
require("dotenv").config();

module.exports = async (req, res, next) => {
  try {
    // 1. Get token from header
    const token = req.header("Authorization");

    if (!token) {
      return res.status(403).json({ error: "Not Authorized" });
    }

    // 2. Verify token
    // Note: Make sure "secret_key_123" matches what you used in login route!
    const payload = jwt.verify(token, "secret_key_123");

    // 3. Add user info to the request
    req.user = payload; 
    next();
  } catch (err) {
    res.status(403).json({ error: "Invalid Token" });
  }
};