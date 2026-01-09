const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const pool = require("./db"); 
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const authorize = require("./middleware/authorize"); // Import the Guard 🛡️

const app = express();
const server = http.createServer(app);

app.use(cors({
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

// --- AUTH ROUTES ---
app.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const userCheck = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (userCheck.rows.length > 0) return res.status(401).json({ error: "User already exists!" });

    const salt = await bcrypt.genSalt(10);
    const bcryptPassword = await bcrypt.hash(password, salt);

    const newUser = await pool.query(
      "INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING *",
      [username, email, bcryptPassword]
    );

    const token = jwt.sign({ user_id: newUser.rows[0].id }, "secret_key_123", { expiresIn: "1h" });
    res.json({ token });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (user.rows.length === 0) return res.status(401).json({ error: "Invalid Creds" });

    const validPassword = await bcrypt.compare(password, user.rows[0].password_hash);
    if (!validPassword) return res.status(401).json({ error: "Invalid Creds" });

    const token = jwt.sign({ user_id: user.rows[0].id }, "secret_key_123", { expiresIn: "1h" });
    res.json({ token });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// --- PROTECTED TASK ROUTES (Note the 'authorize' middleware!) ---

// GET MY TASKS
app.get("/tasks", authorize, async (req, res) => {
    try {
        // Only get tasks for THIS user
        const allTasks = await pool.query(
            "SELECT * FROM tasks WHERE user_id = $1 ORDER BY position ASC", 
            [req.user.user_id]
        );
        res.json(allTasks.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// ADD TASK (With User ID)
app.post("/tasks", authorize, async (req, res) => {
    try {
        const { title, status, priority } = req.body;
        // Insert with user_id
        const newTask = await pool.query(
            "INSERT INTO tasks (title, status, priority, position, user_id) VALUES($1, $2, $3, $4, $5) RETURNING *",
            [title, status, priority, 0, req.user.user_id]
        );
        
        // Only notify THIS user via socket room (Simple version: just emit to all for now, but frontend filters)
        io.emit("tasksUpdated", newTask.rows[0]); 
        
        res.json(newTask.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// DELETE TASK (Only if I own it)
app.delete("/tasks/:id", authorize, async (req, res) => {
    try {
        const { id } = req.params;
        const deleteOp = await pool.query("DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING *", [id, req.user.user_id]);
        
        if(deleteOp.rows.length === 0) {
            return res.json("This task is not yours!");
        }

        io.emit("taskDeleted", id);
        res.json("Task deleted!");
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// UPDATE TASK
app.put("/tasks/:id", authorize, async (req, res) => {
    try {
        const { id } = req.params;
        const { status, position } = req.body;

        await pool.query(
            "UPDATE tasks SET status = $1, position = $2 WHERE id = $3 AND user_id = $4",
            [status, position, id, req.user.user_id]
        );

        res.json("Task updated!");
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT} 🚀`);
});