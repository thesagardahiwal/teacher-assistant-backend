import { Request, Response } from "express";
import Attendance from "../models/attendance.model";
import LectureSession from "../models/lectureSession.model";
import Student from "../models/student.model";
import Batch from "../models/batch.model";
import { markAttendanceSchema } from "../validations/attendance.validation";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import { ChartJSNodeCanvas } from "chartjs-node-canvas";

// @desc    Mark attendance for a lecture session
export const markAttendance = async (req: Request, res: Response) => {
  try {
    // Validate request body with Zod
    const parsed = markAttendanceSchema.parse(req.body);
    const { lectureSessionId, presentStudents, absentStudents } = parsed;

    // Check if lecture session exists
    const lectureSession = await LectureSession.findById(lectureSessionId);
    if (!lectureSession) {
      return res.status(404).json({ msg: "Lecture session not found" });
    }

    // Check if attendance already marked
    if (lectureSession.attendanceTaken) {
      return res.status(400).json({ msg: "Attendance already marked for this session" });
    }

    // Create attendance record
    const attendance = new Attendance({
      sessionId: lectureSession.sessionId,
      subject: lectureSession.subject,
      batch: lectureSession.batch,
      teacher: lectureSession.teacher,
      date: lectureSession.date,
      presentStudents,
      absentStudents,
    });

    await attendance.save();

    // Update lecture session with attendance reference
    lectureSession.attendanceTaken = true;
    lectureSession.attendance = attendance._id as typeof lectureSession.attendance;
    lectureSession.status = "Completed";
    await lectureSession.save();

    // Update student attendance stats
    const allStudents = [...presentStudents, ...absentStudents];
    for (const studentId of allStudents) {
      const student = await Student.findById(studentId);
      if (student) {
        student.attendanceStats.totalLectures += 1;
        if (presentStudents.includes(studentId.toString())) {
          student.attendanceStats.attendedLectures += 1;
        }
        student.attendanceStats.percentage =
          (student.attendanceStats.attendedLectures / student.attendanceStats.totalLectures) * 100;
        await student.save();
      }
    }

    return res.json({
      msg: "Attendance marked successfully",
      attendance,
      lectureSession,
    });
  } catch (err: any) {
    console.error(err);
    return res.status(400).json({
      msg: "Validation or Server Error",
      error: err.message,
    });
  }
};


// @desc    Get attendance for a lecture session
export const getAttendanceByLecture = async (req: Request, res: Response) => {
  try {
    const { lectureSessionId } = req.params;

    const lectureSession = await LectureSession.findById(lectureSessionId).populate("subject batch teacher");
    if (!lectureSession) {
      return res.status(404).json({ msg: "Lecture session not found" });
    }

    if (!lectureSession.attendance) {
      return res.status(404).json({ msg: "Attendance not marked for this lecture yet" });
    }

    const attendance = await Attendance.findById(lectureSession.attendance)
      .populate("presentStudents", "rollNumber name email")
      .populate("absentStudents", "rollNumber name email");

    return res.json({
      lectureSession,
      attendance,
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({
      msg: "Server Error",
      error: err.message,
    });
  }
};

// @desc    Get overall attendance summary for a student
export const getStudentAttendanceSummary = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ msg: "Student not found" });
    }

    // Use stats already stored in student document
    const { totalLectures, attendedLectures, percentage } = student.attendanceStats;

    // Optional: get list of attended/absent sessions
    const attendanceRecords = await Attendance.find({
      $or: [
        { presentStudents: studentId },
        { absentStudents: studentId }
      ]
    })
      .populate("subject batch teacher", "name");

    return res.json({
      student: {
        id: student._id,
        name: student.name,
        rollNumber: student.rollNumber,
        email: student.email,
      },
      summary: {
        totalLectures,
        attendedLectures,
        percentage,
      },
      detailedRecords: attendanceRecords.map(record => ({
        sessionId: record.sessionId,
        subject: (record.subject as any)?.name,
        batch: (record.batch as any)?.name,
        teacher: (record.teacher as any)?.name,
        date: record.date,
        status: record.presentStudents.map((id: any) => id.toString()).includes((student._id as string).toString()) ? "Present" : "Absent"
      }))
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({
      msg: "Server Error",
      error: err.message,
    });
  }
};


// @desc    Get attendance summary for a batch (all students)
// Optional: filter by subject
export const getBatchAttendanceSummary = async (req: Request, res: Response) => {
  try {
    const { batchId } = req.params;
    const { subjectId } = req.query; // optional filter

    const batch = await Batch.findById(batchId).populate("students");
    if (!batch) {
      return res.status(404).json({ msg: "Batch not found" });
    }

    // Prepare results
    const summary = [];

    for (const student of batch.students as any[]) {
      let { totalLectures, attendedLectures, percentage } = student.attendanceStats;

      // Filter subject-specific stats if requested
      if (subjectId) {
        const subjectStats = student.subjectWiseAttendance?.[subjectId as string];
        if (subjectStats) {
          totalLectures = subjectStats.totalLectures;
          attendedLectures = subjectStats.attendedLectures;
          percentage = subjectStats.percentage;
        } else {
          totalLectures = 0;
          attendedLectures = 0;
          percentage = 0;
        }
      }

      summary.push({
        studentId: student._id,
        name: student.name,
        rollNumber: student.rollNumber,
        email: student.email,
        totalLectures,
        attendedLectures,
        percentage,
      });
    }

    return res.json({
      batch: { id: batch._id, name: batch.name, year: batch.year, department: batch.department },
      subjectFilter: subjectId ? subjectId : "All Subjects",
      summary,
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({
      msg: "Server Error",
      error: err.message,
    });
  }
};

// @desc    Export batch attendance summary as Excel/CSV
export const exportBatchAttendance = async (req: Request, res: Response) => {
  try {
    const { batchId } = req.params;
    const { subjectId, format } = req.query; // format = "xlsx" | "csv"

    const batch = await Batch.findById(batchId).populate("students");
    if (!batch) {
      return res.status(404).json({ msg: "Batch not found" });
    }

    // Prepare workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Attendance Summary");

    // Headers
    worksheet.columns = [
      { header: "Roll No", key: "rollNumber", width: 12 },
      { header: "Name", key: "name", width: 25 },
      { header: "Email", key: "email", width: 25 },
      { header: "Total Lectures", key: "totalLectures", width: 15 },
      { header: "Attended Lectures", key: "attendedLectures", width: 18 },
      { header: "Percentage", key: "percentage", width: 12 }
    ];

    // Data rows
    for (const student of batch.students as any[]) {
      let { totalLectures, attendedLectures, percentage } = student.attendanceStats;

      if (subjectId) {
        const subjectStats = student.subjectWiseAttendance?.[subjectId as string];
        if (subjectStats) {
          totalLectures = subjectStats.totalLectures;
          attendedLectures = subjectStats.attendedLectures;
          percentage = subjectStats.percentage;
        } else {
          totalLectures = 0;
          attendedLectures = 0;
          percentage = 0;
        }
      }

      worksheet.addRow({
        rollNumber: student.rollNumber,
        name: student.name,
        email: student.email,
        totalLectures,
        attendedLectures,
        percentage: `${percentage.toFixed(2)}%`
      });
    }

    // Export as XLSX or CSV
    const fileName = `Batch_${batch.name}_Attendance.${format === "csv" ? "csv" : "xlsx"}`;
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${fileName}`
    );

    if (format === "csv") {
      res.setHeader("Content-Type", "text/csv");
      await workbook.csv.write(res);
    } else {
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      await workbook.xlsx.write(res);
    }

    res.end();
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({
      msg: "Server Error",
      error: err.message,
    });
  }
};

// @desc    Export batch attendance summary as PDF (with chart)
export const exportBatchAttendancePDF = async (req: Request, res: Response) => {
  try {
    const { batchId } = req.params;
    const { subjectId } = req.query;

    const batch = await Batch.findById(batchId).populate("students");
    if (!batch) {
      return res.status(404).json({ msg: "Batch not found" });
    }

    // Prepare data
    const studentNames: string[] = [];
    const percentages: number[] = [];

    for (const student of batch.students as any[]) {
      let { percentage } = student.attendanceStats;

      if (subjectId) {
        const subjectStats = student.subjectWiseAttendance?.[subjectId as string];
        percentage = subjectStats ? subjectStats.percentage : 0;
      }

      studentNames.push(student.name);
      percentages.push(percentage);
    }

    // Generate Chart (Bar)
    const width = 800;
    const height = 400;
    const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });

    const chartBuffer = await chartJSNodeCanvas.renderToBuffer({
      type: "bar",
      data: {
        labels: studentNames,
        datasets: [
          {
            label: "Attendance %",
            data: percentages,
          },
        ],
      },
      options: {
        responsive: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          y: { beginAtZero: true, max: 100 },
        },
      },
    });

    // Generate PDF
    const doc = new PDFDocument({ margin: 40, size: "A4" });
    const fileName = `Batch_${batch.name}_Attendance.pdf`;

    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
    res.setHeader("Content-Type", "application/pdf");

    doc.pipe(res);

    // Title
    doc.fontSize(18).text(`Attendance Report - ${batch.name}`, { align: "center" });
    doc.moveDown();

    // Batch details
    doc.fontSize(12).text(`Department: ${batch.department}`);
    doc.text(`Year: ${batch.year}`);
    doc.text(`Total Students: ${batch.students.length}`);
    if (subjectId) {
      doc.text(`Subject ID: ${subjectId}`);
    }
    doc.moveDown();

    // Chart
    doc.image(chartBuffer, { fit: [500, 300], align: "center" });
    doc.moveDown();

    // Table header
    doc.fontSize(14).text("Student Attendance Summary", { underline: true });
    doc.moveDown(0.5);

    doc.fontSize(10);
    batch.students.forEach((student: any, idx: number) => {
      let { totalLectures, attendedLectures, percentage } = student.attendanceStats;

      if (subjectId) {
        const subjectStats = student.subjectWiseAttendance?.[subjectId as string];
        if (subjectStats) {
          totalLectures = subjectStats.totalLectures;
          attendedLectures = subjectStats.attendedLectures;
          percentage = subjectStats.percentage;
        } else {
          totalLectures = 0;
          attendedLectures = 0;
          percentage = 0;
        }
      }

      doc.text(
        `${idx + 1}. ${student.rollNumber} - ${student.name} | Attended: ${attendedLectures}/${totalLectures} | ${percentage.toFixed(2)}%`
      );
    });

    doc.end();
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({
      msg: "Server Error",
      error: err.message,
    });
  }
};

// @desc    Get analytics for a batch (attendance insights)
export const getBatchAttendanceAnalytics = async (req: Request, res: Response) => {
  try {
    const { batchId } = req.params;
    const { subjectId } = req.query;

    const batch = await Batch.findById(batchId).populate("students");
    if (!batch) {
      return res.status(404).json({ msg: "Batch not found" });
    }

    const results: any[] = [];

    let totalPercentage = 0;

    for (const student of batch.students as any[]) {
      let { percentage } = student.attendanceStats;
      let { totalLectures, attendedLectures } = student.attendanceStats;

      if (subjectId) {
        const subjectStats = student.subjectWiseAttendance?.[subjectId as string];
        if (subjectStats) {
          percentage = subjectStats.percentage;
          totalLectures = subjectStats.totalLectures;
          attendedLectures = subjectStats.attendedLectures;
        } else {
          percentage = 0;
          totalLectures = 0;
          attendedLectures = 0;
        }
      }

      totalPercentage += percentage;

      results.push({
        studentId: student._id,
        name: student.name,
        rollNumber: student.rollNumber,
        percentage,
        attendedLectures,
        totalLectures
      });
    }

    // Sort results by percentage
    results.sort((a, b) => b.percentage - a.percentage);

    // Prepare analytics
    const analytics = {
      batch: {
        id: batch._id,
        name: batch.name,
        year: batch.year,
        department: batch.department,
      },
      subjectFilter: subjectId ? subjectId : "All Subjects",
      totalStudents: results.length,
      averageAttendance: results.length > 0 ? (totalPercentage / results.length).toFixed(2) : "0.00",
      highestPerformers: results.slice(0, 5), // top 5
      lowestPerformers: results.slice(-5).reverse(), // bottom 5
      distribution: {
        above90: results.filter(s => s.percentage >= 90).length,
        between75_89: results.filter(s => s.percentage >= 75 && s.percentage < 90).length,
        between50_74: results.filter(s => s.percentage >= 50 && s.percentage < 75).length,
        below50: results.filter(s => s.percentage < 50).length,
      }
    };

    return res.json(analytics);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({
      msg: "Server Error",
      error: err.message,
    });
  }
};