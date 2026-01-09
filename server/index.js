const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const pool = require("./db"); 
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
const server = http.createServer(app);

// --- 1. CONFIGURATION ---
app.use(cors({
    // Allow your specific Vercel URL
    origin: ["http://localhost:3000", "https://taskflow-pro-sable.vercel.app"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));
app.use(express.json());

const io = new Server(server, {
    cors: {
        origin: ["http://localhost:3000", "https://taskflow-pro-sable.vercel.app"],
        methods: ["GET", "POST"],
        credentials: true
    }
});

// --- 2. AUTH ROUTES (THESE WERE MISSING!) ---

// REGISTER
app.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // 1. Check if user exists
    const userCheck = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (userCheck.rows.length > 0) {
      return res.status(401).json({ error: "User already exists!" });
    }

    // 2. Hash password (encrypt it)
    const salt = await bcrypt.genSalt(10);
    const bcryptPassword = await bcrypt.hash(password, salt);

    // 3. Insert into DB
    const newUser = await pool.query(
      "INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING *",
      [username, email, bcryptPassword]
    );

    // 4. Generate Token
    const token = jwt.sign({ user_id: newUser.rows[0].id }, "secret_key_123", { expiresIn: "1h" });

    res.json({ token, user: newUser.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error: " + err.message);
  }
});

// LOGIN
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Find user
    const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (user.rows.length === 0) {
      return res.status(401).json({ error: "Password or Email is incorrect" });
    }

    // 2. Check Password
    const validPassword = await bcrypt.compare(password, user.rows[0].password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: "Password or Email is incorrect" });
    }

    // 3. Generate Token
    const token = jwt.sign({ user_id: user.rows[0].id }, "secret_key_123", { expiresIn: "1h" });

    res.json({ token, user: user.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// --- 3. TASK ROUTES ---

// GET ALL TASKS
app.get("/tasks", async (req, res) => {
    try {
        const allTasks = await pool.query("SELECT * FROM tasks ORDER BY position ASC");
        res.json(allTasks.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// ADD A TASK
app.post("/tasks", async (req, res) => {
    try {
        const { title, status, priority } = req.body;
        const newTask = await pool.query(
            "INSERT INTO tasks (title, status, priority, position) VALUES($1, $2, $3, $4) RETURNING *",
            [title, status, priority, 0]
        );
        
        io.emit("tasksUpdated", (await pool.query("SELECT * FROM tasks ORDER BY position ASC")).rows);
        
        res.json(newTask.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// UPDATE TASK
app.put("/tasks/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { status, position } = req.body;

        await pool.query(
            "UPDATE tasks SET status = $1, position = $2 WHERE id = $3",
            [status, position, id]
        );

        io.emit("tasksUpdated", (await pool.query("SELECT * FROM tasks ORDER BY position ASC")).rows);

        res.json("Task updated!");
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// --- 4. START SERVER ---
const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT} 🚀`);
});