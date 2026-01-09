const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const pool = require("./db"); // Make sure you have db.js connected to Render

const app = express();
const server = http.createServer(app);

// --- 1. CONFIGURATION ---
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

// --- 2. API ROUTES ---

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
        // Default to bottom of list (position 0 or max+1)
        const newTask = await pool.query(
            "INSERT INTO tasks (title, status, priority, position) VALUES($1, $2, $3, $4) RETURNING *",
            [title, status, priority, 0]
        );
        
        // Notify everyone
        io.emit("tasksUpdated", (await pool.query("SELECT * FROM tasks ORDER BY position ASC")).rows);
        
        res.json(newTask.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// UPDATE TASK (DRAG & DROP)
app.put("/tasks/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { status, position } = req.body;

        await pool.query(
            "UPDATE tasks SET status = $1, position = $2 WHERE id = $3",
            [status, position, id]
        );

        // Notify everyone
        io.emit("tasksUpdated", (await pool.query("SELECT * FROM tasks ORDER BY position ASC")).rows);

        res.json("Task updated!");
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// --- 3. START SERVER ---
const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT} 🚀`);
});