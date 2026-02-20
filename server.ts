import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// --- Configuration ---
const PORT = 3000;
const DB_PATH = path.join(process.cwd(), 'attendance.db');

// --- Data Constants (Must match frontend) ---
const MEETING_DATES = [
  '3/8', '3/15', '3/22', 
  '4/12', '4/19', 
  '5/10', '5/17', '5/24', 
  '6/14', '6/21'
];

const INITIAL_NAMES = [
  "배다희", "손여원", "김태린", "현요섭", "김승우", 
  "이은총", "조영광", "문하은", "최예인", "로이", 
  "서다현", "사예한", "이다율", "방태산", "이은서", 
  "민유진", "이태은", "허진주", "오나윤", "시온"
];

// --- Database Setup ---
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

// Initialize Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS attendance (
    student_id INTEGER,
    date_index INTEGER,
    status INTEGER DEFAULT 0,
    PRIMARY KEY (student_id, date_index),
    FOREIGN KEY(student_id) REFERENCES students(id)
  );
`);

// Seed Data if empty
const studentCount = db.prepare('SELECT count(*) as count FROM students').get() as { count: number };
if (studentCount.count === 0) {
  const insertStudent = db.prepare('INSERT INTO students (name) VALUES (?)');
  const insertAttendance = db.prepare('INSERT INTO attendance (student_id, date_index, status) VALUES (?, ?, 0)');
  
  const transaction = db.transaction(() => {
    INITIAL_NAMES.forEach((name) => {
      const info = insertStudent.run(name);
      const studentId = info.lastInsertRowid;
      for (let i = 0; i < MEETING_DATES.length; i++) {
        insertAttendance.run(studentId, i);
      }
    });
  });
  transaction();
  console.log('Database seeded with initial students.');
}

// --- Express & WebSocket Server ---
const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

app.use(express.json());

// API: Get all data
app.get('/api/students', (req, res) => {
  try {
    const students = db.prepare('SELECT * FROM students ORDER BY name ASC').all() as { id: number, name: string }[];
    const attendance = db.prepare('SELECT * FROM attendance').all() as { student_id: number, date_index: number, status: number }[];
    
    // Transform to frontend format
    const result = students.map(s => {
      const studentAttendance = new Array(MEETING_DATES.length).fill(0);
      attendance
        .filter(a => a.student_id === s.id)
        .forEach(a => {
          if (a.date_index < MEETING_DATES.length) {
            studentAttendance[a.date_index] = a.status;
          }
        });
      
      return {
        id: String(s.id),
        name: s.name,
        attendance: studentAttendance
      };
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// API: Toggle Attendance
app.post('/api/attendance/toggle', (req, res) => {
  const { studentId, dateIndex } = req.body;
  
  if (!studentId || dateIndex === undefined) {
    res.status(400).json({ error: 'Missing studentId or dateIndex' });
    return;
  }

  try {
    // Get current status
    const current = db.prepare('SELECT status FROM attendance WHERE student_id = ? AND date_index = ?')
      .get(studentId, dateIndex) as { status: number } | undefined;

    let newStatus = 1;
    if (current) {
      newStatus = current.status === 1 ? 0 : 1;
      db.prepare('UPDATE attendance SET status = ? WHERE student_id = ? AND date_index = ?')
        .run(newStatus, studentId, dateIndex);
    } else {
      // Should not happen if seeded correctly, but handle just in case
      db.prepare('INSERT INTO attendance (student_id, date_index, status) VALUES (?, ?, 1)')
        .run(studentId, dateIndex);
    }

    // Broadcast update to all connected clients
    const broadcastData = JSON.stringify({
      type: 'UPDATE_ATTENDANCE',
      payload: { studentId, dateIndex, status: newStatus }
    });

    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(broadcastData);
      }
    });

    res.json({ success: true, newStatus });
  } catch (error) {
    console.error('Error toggling attendance:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// --- Vite Middleware ---
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: { server } },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve static files (if built)
    // For this environment, we mostly rely on dev mode, but good practice:
    app.use(express.static(path.join(__dirname, 'dist')));
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
