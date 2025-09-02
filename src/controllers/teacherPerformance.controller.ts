import { Request, Response } from "express";
import TeacherAttendance from "../models/teacherAttendace.model";
import LectureSession from "../models/lectureSession.model";
import Attendance from "../models/attendance.model";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";

// Internal helper
const calculatePerformance = async (teacherId: string) => {
  const teacherRecords = await TeacherAttendance.find({ teacher: teacherId });
  const totalDays = teacherRecords.length;
  const presentDays = teacherRecords.filter(r => r.status === "Present").length;
  const teacherAttendancePercent = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

  const lectureSessions = await LectureSession.find({ teacher: teacherId }).populate("attendance");
  let totalStudentPercent = 0;
  let studentCount = 0;

  for (const session of lectureSessions) {
    if (session.attendance) {
      const att = await Attendance.findById(session.attendance).populate("presentStudents absentStudents");
      const total = (att?.presentStudents?.length || 0) + (att?.absentStudents?.length || 0);
      const present = att?.presentStudents?.length || 0;

      if (total > 0) {
        const percent = (present / total) * 100;
        totalStudentPercent += percent;
        studentCount++;
      }
    }
  }

  const avgStudentAttendance = studentCount > 0 ? (totalStudentPercent / studentCount) : 0;
  const avgAssessments = 0; // placeholder

  const performanceScore =
    (0.4 * teacherAttendancePercent) +
    (0.4 * avgStudentAttendance) +
    (0.2 * avgAssessments);

  return {
    teacherAttendancePercent: teacherAttendancePercent.toFixed(2),
    avgStudentAttendance: avgStudentAttendance.toFixed(2),
    avgAssessments: avgAssessments.toFixed(2),
    performanceScore: performanceScore.toFixed(2)
  };
};

// @desc Get teacher performance JSON
export const getTeacherPerformance = async (req: Request, res: Response) => {
  try {
    const { teacherId } = req.params;
    const report = await calculatePerformance(teacherId);
    res.json({ teacherId, ...report });
  } catch (err: any) {
    res.status(500).json({ msg: "Server Error", error: err.message });
  }
};

// @desc Export teacher performance as Excel
export const exportTeacherPerformanceExcel = async (req: Request, res: Response) => {
  try {
    const { teacherId } = req.params;
    const report = await calculatePerformance(teacherId);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Teacher Performance");

    sheet.addRow(["Metric", "Value"]);
    sheet.addRow(["Teacher Attendance %", report.teacherAttendancePercent]);
    sheet.addRow(["Avg Student Attendance %", report.avgStudentAttendance]);
    sheet.addRow(["Avg Assessments %", report.avgAssessments]);
    sheet.addRow(["Performance Score", report.performanceScore]);

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=teacher_${teacherId}_performance.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err: any) {
    res.status(500).json({ msg: "Server Error", error: err.message });
  }
};

// @desc Export teacher performance as PDF
export const exportTeacherPerformancePDF = async (req: Request, res: Response) => {
  try {
    const { teacherId } = req.params;
    const report = await calculatePerformance(teacherId);

    const doc = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=teacher_${teacherId}_performance.pdf`);

    doc.fontSize(18).text("Teacher Performance Report", { align: "center" });
    doc.moveDown();

    doc.fontSize(12).text(`Teacher ID: ${teacherId}`);
    doc.moveDown();

    doc.text(`Teacher Attendance %: ${report.teacherAttendancePercent}`);
    doc.text(`Avg Student Attendance %: ${report.avgStudentAttendance}`);
    doc.text(`Avg Assessments %: ${report.avgAssessments}`);
    doc.text(`Performance Score: ${report.performanceScore}`);

    doc.end();
    doc.pipe(res);
  } catch (err: any) {
    res.status(500).json({ msg: "Server Error", error: err.message });
  }
};
