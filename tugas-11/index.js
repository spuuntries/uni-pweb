const express = require("express");
const cors = require("cors");
const multer = require("multer");
const PDFDocument = require("pdfkit");
const { PrismaClient } = require("./generated/prisma");
const prisma = new PrismaClient();
const app = express();
const path = require("path");

app.enable("trust proxy");
app.use(express.json());
app.use(cors());
app.use(express.static("public"));

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (allowedTypes.includes(file.mimetype)) {
      return cb(null, true);
    }
    cb(new Error("Only image files are allowed!"));
  },
});

// Routes
app.post("/api/register", upload.single("profileImage"), async (req, res) => {
  try {
    const { name, studentId, course, lecturer } = req.body;

    // Check if required fields are present
    if (!name || !studentId || !course || !lecturer) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
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
      imageData: student.imageData ? true : false,
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
      select: { imageData: true, imageType: true },
    });

    if (!student || !student.imageData) {
      return res.status(404).send("Image not found");
    }

    res.setHeader("Content-Type", student.imageType);
    res.send(student.imageData);
  } catch (error) {
    console.error("Error serving image:", error);
    res.status(500).send("Error retrieving image");
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
        imageType: true,
      },
    });

    const studentsWithImageInfo = students.map((student) => ({
      ...student,
      hasImage: Boolean(student.imageType),
    }));

    res.json({ success: true, students: studentsWithImageInfo });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Added this endpoint to get unique lecturers and courses for the filter dropdowns
app.get("/api/filters", async (req, res) => {
  try {
    const students = await prisma.student.findMany({
      select: {
        lecturer: true,
        course: true,
      },
    });

    const lecturers = [...new Set(students.map((student) => student.lecturer))];
    const courses = [...new Set(students.map((student) => student.course))];

    res.json({
      success: true,
      lecturers,
      courses,
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.get("/api/generate-report", async (req, res) => {
  try {
    const { lecturer, course, title } = req.query;

    // Validate request
    if (!lecturer && !course) {
      return res.status(400).json({
        success: false,
        error: "Please provide either lecturer or course parameter",
      });
    }

    // Build the where clause for the query
    const whereClause = {};
    if (lecturer) whereClause.lecturer = lecturer;
    if (course) whereClause.course = course;

    // Get students matching the criteria
    const students = await prisma.student.findMany({
      where: whereClause,
      orderBy: { name: "asc" },
    });

    if (students.length === 0) {
      return res.status(404).json({
        success: false,
        error: "No students found with the given criteria",
      });
    }

    // Create a PDF document
    const doc = new PDFDocument({
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      size: "A4",
      info: {
        Title: title || "Student Report",
        Author: "Student Registration System",
      },
    });

    // Set response headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="student_report.pdf"`
    );

    // Pipe PDF to response
    doc.pipe(res);

    // Add title and report information
    doc
      .font("Helvetica-Bold")
      .fontSize(24)
      .text(title || "Student Report", { align: "center" })
      .moveDown(0.5);

    // Add report criteria
    doc
      .fontSize(12)
      .text(`Report generated on: ${new Date().toLocaleDateString()}`, {
        align: "center",
      })
      .moveDown(0.5);

    if (lecturer) {
      doc.text(`Lecturer: ${lecturer}`, { align: "center" });
    }

    if (course) {
      doc.text(`Course: ${course}`, { align: "center" });
    }

    doc.moveDown(1.5);

    // Add student count
    doc
      .font("Helvetica-Bold")
      .fontSize(14)
      .text(`Total Students: ${students.length}`, { align: "left" })
      .moveDown(1);

    // Table configuration
    const pageWidth = doc.page.width - 100; // 50px margin on each side
    const columns = ["No", "Student ID", "Name", "Course", "Lecturer"];

    // Adjust column widths based on content - give more space to course name
    const colWidths = [
      Math.floor(pageWidth * 0.08), // No - 8%
      Math.floor(pageWidth * 0.15), // Student ID - 15%
      Math.floor(pageWidth * 0.27), // Name - 27%
      Math.floor(pageWidth * 0.25), // Course - 25%
      Math.floor(pageWidth * 0.25), // Lecturer - 25%
    ];

    const colPositions = [50]; // Start at left margin
    for (let i = 1; i < columns.length; i++) {
      colPositions[i] = colPositions[i - 1] + colWidths[i - 1];
    }

    // Increased row height to accommodate multi-line text
    const rowHeight = 40;
    let yPos = doc.y;

    // Draw table header
    doc.fillColor("#E91E63").rect(50, yPos, pageWidth, rowHeight).fill();

    doc.fillColor("white").font("Helvetica-Bold").fontSize(12);

    columns.forEach((col, i) => {
      doc.text(
        col,
        colPositions[i] + 5,
        yPos + 15, // Center vertically in the taller row
        {
          width: colWidths[i] - 10, // Leave padding on both sides
          align: "left",
        }
      );
    });

    yPos += rowHeight;

    // Function to calculate text height
    function getTextHeight(text, fontSize, width) {
      // Rough estimation of how many lines the text will take
      const charactersPerLine = Math.floor(width / (fontSize * 0.5));
      const lines = Math.ceil(text.length / charactersPerLine);
      return lines * (fontSize * 1.2); // Line height is typically 1.2x font size
    }

    // Draw table rows with proper text wrapping
    students.forEach((student, index) => {
      // Calculate dynamic row height based on content
      const courseTextHeight = getTextHeight(
        student.course || "N/A",
        12,
        colWidths[3] - 10
      );
      const nameTextHeight = getTextHeight(
        student.name || "N/A",
        12,
        colWidths[2] - 10
      );
      const dynamicRowHeight = Math.max(
        rowHeight,
        courseTextHeight + 30,
        nameTextHeight + 30
      );

      // Check if we need a new page
      if (yPos + dynamicRowHeight > doc.page.height - 50) {
        doc.addPage();
        yPos = 50;
      }

      // Row background
      doc
        .fillColor(index % 2 === 0 ? "#FCE4EC" : "#FFFFFF")
        .rect(50, yPos, pageWidth, dynamicRowHeight)
        .fill();

      // Row border
      doc
        .strokeColor("#CCCCCC")
        .lineWidth(0.5)
        .rect(50, yPos, pageWidth, dynamicRowHeight)
        .stroke();

      // Cell content
      doc.font("Helvetica").fontSize(12).fillColor("black");

      // No column
      doc.text((index + 1).toString(), colPositions[0] + 5, yPos + 15, {
        width: colWidths[0] - 10,
      });

      // Student ID column
      doc.text(student.studentId || "N/A", colPositions[1] + 5, yPos + 15, {
        width: colWidths[1] - 10,
      });

      // Name column - with word wrapping
      doc.text(student.name || "N/A", colPositions[2] + 5, yPos + 15, {
        width: colWidths[2] - 10,
        align: "left",
      });

      // Course column - with word wrapping
      doc.text(student.course || "N/A", colPositions[3] + 5, yPos + 15, {
        width: colWidths[3] - 10,
        align: "left",
      });

      // Lecturer column
      doc.text(student.lecturer || "N/A", colPositions[4] + 5, yPos + 15, {
        width: colWidths[4] - 10,
        align: "left",
      });

      yPos += dynamicRowHeight;
    });

    // Add footer
    doc
      .fontSize(8)
      .text(
        `Page 1 of 1 • Generated by Student Registration System`,
        50,
        doc.page.height - 50,
        { align: "center", width: doc.page.width - 100 }
      );

    // Finalize the PDF
    doc.end();
  } catch (err) {
    console.error("Report generation error:", err);
    res
      .status(500)
      .json({ success: false, error: "Failed to generate report" });
  }
});

app.get("/reports", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "reports.html"));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
