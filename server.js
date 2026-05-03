const express = require('express');
const cors = require('cors');
const path = require('path');
const mysql = require('mysql2/promise'); // Import promise-based mysql2
require('dotenv').config(); // Load environment variables from .env

const app = express();

app.use(cors());
app.use(express.json());

// 1. Create connection pool to the database
// 1. Create connection pool to the database with hardcoded credentials
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'student_management',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// 2. Initialize database and table on startup
async function initDatabase() {
    const connection = await pool.getConnection();
    try {
        await connection.query(`
            CREATE TABLE IF NOT EXISTS students (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                aridNumber VARCHAR(50) NOT NULL,
                degree VARCHAR(100) NOT NULL,
                cgpa DECIMAL(3,2) NOT NULL
            )
        `);
        console.log('📦 Database and `students` table are ready.');
    } catch (err) {
        console.error('Error creating table:', err);
    } finally {
        connection.release();
    }
}
initDatabase();

// 3. CRUD Routes

// GET: Retrieve all students
app.get('/getStudents', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM students');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST: Add a new student
app.post('/addStudent', async (req, res) => {
    const { name, aridNumber, degree, cgpa } = req.body;
    try {
        const [result] = await pool.query(
            'INSERT INTO students (name, aridNumber, degree, cgpa) VALUES (?, ?, ?, ?)',
            [name, aridNumber, degree, cgpa]
        );
        res.json({ success: true, id: result.insertId, message: "Student added successfully!" });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// PUT: Update an existing student by ID
app.put('/updateStudent/:id', async (req, res) => {
    const { id } = req.params;
    const { name, aridNumber, degree, cgpa } = req.body;
    try {
        const [result] = await pool.query(
            'UPDATE students SET name = ?, aridNumber = ?, degree = ?, cgpa = ? WHERE id = ?',
            [name, aridNumber, degree, cgpa, id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Student not found." });
        }
        res.json({ success: true, message: "Student updated successfully!" });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// DELETE: Remove a student by ID
app.delete('/deleteStudent/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await pool.query('DELETE FROM students WHERE id = ?', [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Student not found." });
        }
        res.json({ success: true, message: "Student deleted successfully!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. STATIC FILES
app.use(express.static(path.join(__dirname, 'public')));

// 5. START SERVER
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});