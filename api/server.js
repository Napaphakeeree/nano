const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcrypt');

const app = express();
const prisma = new PrismaClient();
const port = 3001;  // Express port

let temperature = null; // สร้างตัวแปรข้อมูลอุณหภูมิ
let humidity = null;

// Middleware แปลงข้อมูล JSON
app.use(bodyParser.json());

app.use(cors({
  origin: '20.205.24.139' // เปลี่ยนเป็น*เพื่อเทส แต่ทำส่งใส่ip ของazure
}));

// API POST สำหรับ ESP32 ให้ส่งข้อมูลเข้ามา
app.post("/updateTemperature", (req, res) => {
  const temp = req.body.temperature;
  if (temp !== undefined) {
    temperature = temp;
    console.log(`Received temperature: ${temperature}`);
    res.status(200).send("Data received");
  } else {
    console.log("Temperature data is missing");
    res.status(400).send("Temperature data is missing");
  }
});

app.post("/updateHumidity", (req, res) => {
  const hum = req.body.humidity;
  if (hum !== undefined) {
    humidity = hum;
    console.log(`Received humidity: ${humidity}`);
    res.status(200).send("Data received");
  } else {
    console.log("Humidity data is missing");
    res.status(400).send("Humidity data is missing");
  }
});

// API สำหรับ React web ให้ดึงข้อมูลจาก Express ไปใช้
app.get("/getTemperature", (req, res) => {
  if (temperature !== null) {
    res.json({ temperature: temperature });
  } else {
    res.status(404).send("Temperature data not available");
  }
});

app.get("/getHumidity", (req, res) => {
  if (humidity !== null) {
    res.json({ humidity: humidity });
  } else {
    res.status(404).send("Humidity data not available");
  }
});

// เปิดใช้งาน Express พร้อมแสดงข้อความ
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

app.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    const existingUser = await prisma.user_accout.findUnique({
      where: { email: email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user_accout.create({
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

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user_accout.findUnique({
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
