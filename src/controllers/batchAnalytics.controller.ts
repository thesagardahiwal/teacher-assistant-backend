import { Request, Response } from "express";
import Student from "../models/student.model";
import Attendance from "../models/attendance.model";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";

// Internal helper: Calculate batch analytics
const calculateBatchAnalytics = async (batchId: string, subjectId?: string) => {
  const students = await Student.find({ batch: batchId, ...(subjectId ? { subject: subjectId } : {}) });

  let totalAttendancePercent = 0;
  const studentReports: any[] = [];

  for (const student of students as Array<typeof Student.prototype>) {
    let totalLectures = 0;
    let presentLectures = 0;

    const attendanceRecords = await Attendance.find({
      $or: [
        { presentStudents: student._id },
        { absentStudents: student._id }
      ]
    });

    for (const record of attendanceRecords) {
      totalLectures++;
      if (record.presentStudents.map((id: any) => id.toString()).includes(student._id.toString())) presentLectures++;
    }

    const attendancePercent = totalLectures > 0 ? (presentLectures / totalLectures) * 100 : 0;
    totalAttendancePercent += attendancePercent;

    studentReports.push({
      studentId: student._id,
      name: student.name,
      rollNumber: student.rollNumber,
      attendancePercent: attendancePercent.toFixed(2)
    });
  }

  const avgAttendance = students.length > 0 ? (totalAttendancePercent / students.length) : 0;

  const topPerformers = [...studentReports].sort((a, b) => parseFloat(b.attendancePercent) - parseFloat(a.attendancePercent)).slice(0, 5);
  const lowPerformers = [...studentReports].sort((a, b) => parseFloat(a.attendancePercent) - parseFloat(b.attendancePercent)).slice(0, 5);

  return {
    batchId,
    subjectId,
    avgAttendance: avgAttendance.toFixed(2),
    topPerformers,
    lowPerformers,
    totalStudents: students.length,
    studentReports
  };
};

// @desc Get batch analytics (JSON)
export const getBatchAnalytics = async (req: Request, res: Response) => {
  try {
    const { batchId } = req.params;
    const { subjectId } = req.query;

    const report = await calculateBatchAnalytics(batchId, subjectId as string);
    res.json(report);
  } catch (err: any) {
    res.status(500).json({ msg: "Server Error", error: err.message });
  }
};

// @desc Export batch analytics to Excel
export const exportBatchAnalyticsExcel = async (req: Request, res: Response) => {
  try {
    const { batchId } = req.params;
    const { subjectId } = req.query;

    const report = await calculateBatchAnalytics(batchId, subjectId as string);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Batch Analytics");

    sheet.addRow(["Batch Analytics Report"]);
    sheet.addRow([`Batch ID: ${batchId}`, `Subject ID: ${subjectId || "All"}`]);
    sheet.addRow([]);
    sheet.addRow(["Metric", "Value"]);
    sheet.addRow(["Average Attendance %", report.avgAttendance]);
    sheet.addRow(["Total Students", report.totalStudents]);
    sheet.addRow([]);

    sheet.addRow(["Student Roll", "Name", "Attendance %"]);
    report.studentReports.forEach((s: any) => {
      sheet.addRow([s.rollNumber, s.name, s.attendancePercent]);
    });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=batch_${batchId}_analytics.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err: any) {
    res.status(500).json({ msg: "Server Error", error: err.message });
  }
};

// @desc Export batch analytics to PDF
export const exportBatchAnalyticsPDF = async (req: Request, res: Response) => {
  try {
    const { batchId } = req.params;
    const { subjectId } = req.query;

    const report = await calculateBatchAnalytics(batchId, subjectId as string);

    const doc = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=batch_${batchId}_analytics.pdf`);

    doc.fontSize(18).text("Batch Analytics Report", { align: "center" });
    doc.moveDown();

    doc.fontSize(12).text(`Batch ID: ${batchId}`);
    if (subjectId) doc.text(`Subject ID: ${subjectId}`);
    doc.text(`Average Attendance %: ${report.avgAttendance}`);
    doc.text(`Total Students: ${report.totalStudents}`);
    doc.moveDown();

    doc.fontSize(14).text("Students Performance", { underline: true });
    report.studentReports.forEach((s: any) => {
      doc.fontSize(12).text(`${s.rollNumber} - ${s.name} : ${s.attendancePercent}%`);
    });

    doc.end();
    doc.pipe(res);
  } catch (err: any) {
    res.status(500).json({ msg: "Server Error", error: err.message });
  }
};
