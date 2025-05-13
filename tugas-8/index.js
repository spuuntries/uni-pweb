require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();

app.enable("trust proxy");
app.use(express.json());
app.use(cors());
app.use(express.static("public"));

// MongoDB Student model
const Student = mongoose.model("Student", {
  name: String,
  studentId: String,
  course: String,
  lecturer: String,
});

// Routes
app.post("/api/register", async (req, res) => {
  try {
    const student = new Student(req.body);
    await student.save();
    res.json({ success: true, student });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.get("/api/students", async (req, res) => {
  try {
    const students = await Student.find();
    res.json({ success: true, students });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
mongoose.connect(process.env.MONGODB_URI).then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});

module.exports = app;
