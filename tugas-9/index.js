require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("./generated/prisma");
const prisma = new PrismaClient();
const app = express();

app.enable("trust proxy");
app.use(express.json());
app.use(cors());
app.use(express.static("public"));

// Routes
app.post("/api/register", async (req, res) => {
  try {
    const student = await prisma.student.create({
      data: {
        name: req.body.name,
        studentId: req.body.studentId,
        course: req.body.course,
        lecturer: req.body.lecturer,
      },
    });
    res.json({ success: true, student });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.get("/api/students", async (req, res) => {
  try {
    const students = await prisma.student.findMany();
    res.json({ success: true, students });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
