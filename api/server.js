const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const app = express();
const prisma = new PrismaClient();
const port = 3001;  // Express port

let totalStudents = null; // จำนวนคนในห้อง
let behaviorAvg = null; // ค่าเฉลี่ยพฤติกรรม

// Middleware แปลงข้อมูล JSON
app.use(bodyParser.json());

// ตั้งค่า CORS
app.use(cors({
  origin: '20.205.24.139' // เปลี่ยนเป็น*เพื่อเทส แต่ทำส่งใส่ip ของazure
}));

// API POST สำหรับอัปเดตข้อมูลจำนวนคนในห้องและค่าเฉลี่ยพฤติกรรม
app.post("/updateRoomData", (req, res) => {
  const { students, behaviorLevel } = req.body;

  if (students === undefined || behaviorLevel === undefined) {
    return res.status(400).send("Missing students or behaviorLevel in request body");
  }

  if (behaviorLevel < 1 || behaviorLevel > 5) {
    return res.status(400).send("Behavior level must be between 1 and 5");
  }

  totalStudents = students;
  behaviorAvg = behaviorLevel;

  console.log(`Updated data - Total Students: ${totalStudents}, Behavior Avg.: ${behaviorAvg}`);
  res.status(200).send("Room data updated successfully");
});

// API สำหรับดึงข้อมูลจำนวนคนในห้องและค่าเฉลี่ยพฤติกรรม
app.get("/getRoomData", (req, res) => {
  if (totalStudents === null || behaviorAvg === null) {
    return res.status(404).send("Room data not available");
  }

  res.json({
    totalStudents: totalStudents,
    behaviorAvg: behaviorAvg
  });
});

// เปิดใช้งาน Express พร้อมแสดงข้อความ
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// การลงทะเบียนผู้ใช้ใหม่
app.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    const existingUser = await prisma.user_account.findUnique({
      where: { email: email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user_account.create({
      data: {
        email: email,
        password: hashedPassword,
      },
    });

    res.status(201).json({ message: 'User registered successfully.', user: newUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// การเข้าสู่ระบบ
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user_account.findUnique({
    where: { email: email }
  });

  if (!user) {
    return res.status(400).json({ message: 'User not found' });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    return res.status(401).json({ message: 'Invalid password' });
  }

  res.json({ message: 'Login successful' });
});
