const jwt = require("jsonwebtoken");
require("dotenv").config();

module.exports = async (req, res, next) => {
    try {
        const token = req.header("token");
        if (!token) {
            return res.status(403).json("Not Authorized");
        }
        const payload = jwt.verify(token, process.env.JWT_SECRET || "secretKey");
        req.user = payload.id; // Adds user ID to the request
        next();
    } catch (err) {
        console.error(err.message);
        return res.status(403).json("Not Authorized");
    }
};