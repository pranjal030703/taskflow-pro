const router = require('express').Router();
const pool = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 1. REGISTER USER
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Check if user exists
        const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        if (user.rows.length > 0) {
            return res.status(401).json("User already exists!");
        }

        // Encrypt Password (The "Salt" creates random complexity)
        const salt = await bcrypt.genSalt(10);
        const bcryptPassword = await bcrypt.hash(password, salt);

        // Save to Database
        const newUser = await pool.query(
            "INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING *",
            [username, email, bcryptPassword]
        );

        // Generate Token
        const token = jwt.sign({ id: newUser.rows[0].id }, process.env.JWT_SECRET || "secretKey", { expiresIn: "1h" });

        res.json({ token, user: newUser.rows[0] });

    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// 2. LOGIN USER
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user exists
        const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        if (user.rows.length === 0) {
            return res.status(401).json("Password or Email is incorrect");
        }

        // Check Password
        const validPassword = await bcrypt.compare(password, user.rows[0].password_hash);
        if (!validPassword) {
            return res.status(401).json("Password or Email is incorrect");
        }

        // Generate Token
        const token = jwt.sign({ id: user.rows[0].id }, process.env.JWT_SECRET || "secretKey", { expiresIn: "1h" });

        res.json({ token, user: user.rows[0] });

    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

module.exports = router;