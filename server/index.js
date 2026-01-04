const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const pool = require('./db');
const authRoutes = require('./routes/auth');
const app = express();
const server = http.createServer(app);
const authorize = require('./middleware/authorize');
// Setup Socket.IO (for Realtime updates later)
const io = new Server(server, {
    cors: { origin: "http://localhost:3000", methods: ["GET", "POST", "PUT", "DELETE"] }
});

app.use(cors({
    origin: ["http://localhost:3000", "https://taskflow-pro-sable.vercel.app"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));
app.use(express.json());
// Auth Middleware
app.use('/auth', authRoutes);
// --- API ROUTES ---

// 1. GET ALL TASKS
app.get('/api/tasks', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM tasks WHERE assignee_id = $1 ORDER BY id ASC', [req.user ]);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// 2. CREATE A TASK
app.post('/api/tasks', authorize, async (req, res) => { // Added 'authorize'
    const { title, description, status, priority } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO tasks (title, description, status, priority, assignee_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [title, description, status, priority, req.user] // Uses req.user from token!
        );
        io.emit("task_updated", { type: "CREATE", task: result.rows[0] }); // Notify frontend
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});
// 3. UPDATE TASK STATUS (Drag & Drop)
app.put('/api/tasks/:id', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        const update = await pool.query(
            'UPDATE tasks SET status = $1 WHERE id = $2 RETURNING *',
            [status, id]
        );
        
        io.emit("task_updated", { type: "UPDATE", task: update.rows[0] }); // Notify everyone
        res.json(update.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});
// 4. MOCK AI SUMMARY (Free Version)
app.post('/api/ai-summary', async (req, res) => {
    try {
        // 1. Fetch actual tasks so the summary feels real
        const result = await pool.query('SELECT * FROM tasks');
        const tasks = result.rows;

        const todoCount = tasks.filter(t => t.status === 'TODO').length;
        const doneCount = tasks.filter(t => t.status === 'DONE').length;

        // 2. Generate a "Fake" AI Response based on real data
        const mockSummary = `
        🤖 **AI Weekly Report:**
        
        Great job! You have completed **${doneCount}** tasks so far.
        However, you still have **${todoCount}** tasks in your To-Do list.
        
        **Recommendation:** Focus on clearing your high-priority items before the weekend!
        `;

        // 3. Send it back to frontend with a slight delay (to simulate AI thinking)
        setTimeout(() => {
            res.json({ summary: mockSummary });
        }, 1500); // 1.5 second delay

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});
// 3. UPDATE TASK STATUS (Drag & Drop Route)
app.put('/api/tasks/:id', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        const result = await pool.query(
            'UPDATE tasks SET status = $1 WHERE id = $2 RETURNING *',
            [status, id]
        );
        
        // Notify frontend that task has moved
        io.emit("task_updated", { type: "UPDATE", task: result.rows[0] });
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// 3. START SERVER
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});