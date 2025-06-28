const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { PrismaClient } = require("./generated/prisma");
const prisma = new PrismaClient();
const app = express();

app.enable("trust proxy");
app.use(express.json());
app.use(cors());
app.use(express.static("public"));

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed!'));
  }
});

// Routes
app.post("/api/register", upload.single('profileImage'), async (req, res) => {
  try {
    const { name, studentId, course, lecturer } = req.body;
    
    // Check if required fields are present
    if (!name || !studentId || !course || !lecturer) {
      return res.status(400).json({ 
        success: false, 
        error: "Missing required fields" 
      });
    }
    
    // Prepare data object for Prisma
    const studentData = {
      name,
      studentId,
      course,
      lecturer,
    };
    
    // Add image data if present
    if (req.file) {
      studentData.imageData = req.file.buffer;
      studentData.imageType = req.file.mimetype;
    }
    
    const student = await prisma.student.create({
      data: studentData,
    });
    
    const responseStudent = {
      ...student,
      imageData: student.imageData ? true : false 
    };
    
    res.json({ success: true, student: responseStudent });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(400).json({ success: false, error: err.message });
  }
});

app.get("/api/student-image/:id", async (req, res) => {
  try {
    const studentId = parseInt(req.params.id);
    
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { imageData: true, imageType: true }
    });
    
    if (!student || !student.imageData) {
      return res.status(404).send('Image not found');
    }
    
    res.setHeader('Content-Type', student.imageType);
    res.send(student.imageData);
    
  } catch (error) {
    console.error("Error serving image:", error);
    res.status(500).send('Error retrieving image');
  }
});

app.get("/api/students", async (req, res) => {
  try {
    const students = await prisma.student.findMany({
      select: {
        id: true,
        name: true,
        studentId: true,
        course: true,
        lecturer: true,
        // Don't include image data, just indicate if it exists
        imageData: false,
        imageType: true
      }
    });
    
    // Add a flag to indicate which students have images
    const studentsWithImageInfo = students.map(student => ({
      ...student,
      hasImage: Boolean(student.imageType)
    }));
    
    res.json({ success: true, students: studentsWithImageInfo });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
