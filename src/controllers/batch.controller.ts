import { Request, Response } from "express";
import Batch from "../models/batch.model";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import Attendance from "../models/attendance.model";

// @desc Create Batch
export const createBatch = async (req: Request, res: Response) => {
  try {
    const { batchId, name, year, department, students, teachers, subjects } = req.body;

    const batch = new Batch({
      batchId,
      name,
      year,
      department,
      students,
      teachers,
      subjects
    });

    await batch.save();
    res.status(201).json({ msg: "Batch created successfully", batch });
  } catch (err: any) {
    res.status(500).json({ msg: "Server Error", error: err.message });
  }
};

// @desc Get Batch by ID
export const getBatchById = async (req: Request, res: Response) => {
  try {
    const { batchId } = req.params;

    const batch = await Batch.findById(batchId)
      .populate("students", "name rollNumber email")
      .populate("teachers", "name email department")
      .populate("subjects", "name code credits");

    if (!batch) return res.status(404).json({ msg: "Batch not found" });

    res.json(batch);
  } catch (err: any) {
    res.status(500).json({ msg: "Server Error", error: err.message });
  }
};

// @desc Update Batch
export const updateBatch = async (req: Request, res: Response) => {
  try {
    const { batchId } = req.params;
    const updates = req.body;

    const batch = await Batch.findByIdAndUpdate(batchId, updates, { new: true });

    if (!batch) return res.status(404).json({ msg: "Batch not found" });

    res.json({ msg: "Batch updated", batch });
  } catch (err: any) {
    res.status(500).json({ msg: "Server Error", error: err.message });
  }
};

// @desc Delete Batch
export const deleteBatch = async (req: Request, res: Response) => {
  try {
    const { batchId } = req.params;
    const batch = await Batch.findByIdAndDelete(batchId);

    if (!batch) return res.status(404).json({ msg: "Batch not found" });

    res.json({ msg: "Batch deleted successfully" });
  } catch (err: any) {
    res.status(500).json({ msg: "Server Error", error: err.message });
  }
};

// @desc List all batches
export const getAllBatches = async (req: Request, res: Response) => {
  try {
    const { department, year } = req.query;

    const filters: any = {};
    if (department) filters.department = department;
    if (year) filters.year = year;

    const batches = await Batch.find(filters)
      .populate("students", "name rollNumber")
      .populate("teachers", "name")
      .populate("subjects", "name");

    res.json(batches);
  } catch (err: any) {
    res.status(500).json({ msg: "Server Error", error: err.message });
  }
};

// @desc Export batch details to Excel
export const exportBatchExcel = async (req: Request, res: Response) => {
  try {
    const { batchId } = req.params;
    const batch = await Batch.findById(batchId)
      .populate("students", "name rollNumber email")
      .populate("teachers", "name email department")
      .populate("subjects", "name code credits");

    if (!batch) return res.status(404).json({ msg: "Batch not found" });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Batch Details");

    sheet.addRow(["Batch Details"]);
    sheet.addRow([`Name: ${batch.name}`, `Year: ${batch.year}`, `Department: ${batch.department}`]);
    sheet.addRow([]);

    sheet.addRow(["Roll No", "Name", "Email"]);
    batch.students.forEach((s: any) => {
      sheet.addRow([s.rollNumber, s.name, s.email]);
    });

    sheet.addRow([]);
    sheet.addRow(["Teachers"]);
    batch.teachers.forEach((t: any) => {
      sheet.addRow([t.name, t.email, t.department]);
    });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=batch_${batchId}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err: any) {
    res.status(500).json({ msg: "Server Error", error: err.message });
  }
};

// @desc Export batch details to PDF
export const exportBatchPDF = async (req: Request, res: Response) => {
  try {
    const { batchId } = req.params;
    const batch = await Batch.findById(batchId)
      .populate("students", "name rollNumber email")
      .populate("teachers", "name email department")
      .populate("subjects", "name code credits");

    if (!batch) return res.status(404).json({ msg: "Batch not found" });

    const doc = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=batch_${batchId}.pdf`);

    doc.fontSize(18).text("Batch Details", { align: "center" });
    doc.moveDown();

    doc.fontSize(14).text(`Name: ${batch.name}`);
    doc.text(`Year: ${batch.year}`);
    doc.text(`Department: ${batch.department}`);
    doc.moveDown();

    doc.fontSize(14).text("Students", { underline: true });
    batch.students.forEach((s: any) => {
      doc.fontSize(12).text(`${s.rollNumber} - ${s.name} (${s.email || "N/A"})`);
    });
    doc.moveDown();

    doc.fontSize(14).text("Teachers", { underline: true });
    batch.teachers.forEach((t: any) => {
      doc.fontSize(12).text(`${t.name} (${t.email}) - ${t.department}`);
    });

    doc.end();
    doc.pipe(res);
  } catch (err: any) {
    res.status(500).json({ msg: "Server Error", error: err.message });
  }
};

// 🔹 Helper: calculate attendance % per subject + overall
const getStudentAttendance = async (studentId: string, subjects: any[]) => {
  let subjectAttendance: Record<string, string> = {};
  let totalLectures = 0;
  let totalPresent = 0;

  for (const subject of subjects) {
    const records = await Attendance.find({ subject: subject._id });
    let total = records.length;
    let present = records.filter(r => r.presentStudents.map((id: any) => id.toString()).includes(studentId.toString())).length;

    subjectAttendance[subject.name] = total > 0 ? ((present / total) * 100).toFixed(2) : "0.00";

    totalLectures += total;
    totalPresent += present;
  }

  // overall percentage
  const overall = totalLectures > 0 ? ((totalPresent / totalLectures) * 100).toFixed(2) : "0.00";

  return { subjectAttendance, overall };
};

// 🔹 Export Batch Student List → Excel (with subject-wise + overall)
export const exportBatchStudentsExcel = async (req: Request, res: Response) => {
  try {
    const { batchId } = req.params;
    const batch = await Batch.findById(batchId)
      .populate("students", "name rollNumber email")
      .populate("subjects", "name code");

    if (!batch) return res.status(404).json({ msg: "Batch not found" });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Student List");

    // Title
    sheet.addRow(["Batch Student List"]);
    sheet.addRow([`Batch: ${batch.name}`, `Department: ${batch.department}`, `Year: ${batch.year}`]);
    sheet.addRow([]);

    // Dynamic Headers
    let headers = ["Roll No", "Name", "Email"];
    batch.subjects.forEach((sub: any) => headers.push(`${sub.name} %`));
    headers.push("Overall %");
    sheet.addRow(headers);

    // Rows with subject-wise + overall attendance
    for (const student of batch.students as any[]) {
      const { subjectAttendance, overall } = await getStudentAttendance(student._id, batch.subjects as any[]);
      let row = [student.rollNumber, student.name, student.email];
      batch.subjects.forEach((sub: any) => row.push(subjectAttendance[sub.name] || "0.00"));
      row.push(overall);
      sheet.addRow(row);
    }

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=batch_${batchId}_students.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err: any) {
    res.status(500).json({ msg: "Server Error", error: err.message });
  }
};

// 🔹 Export Batch Student List → PDF (with subject-wise + overall)
export const exportBatchStudentsPDF = async (req: Request, res: Response) => {
  try {
    const { batchId } = req.params;
    const batch = await Batch.findById(batchId)
      .populate("students", "name rollNumber email")
      .populate("subjects", "name code");

    if (!batch) return res.status(404).json({ msg: "Batch not found" });

    const doc = new PDFDocument({ margin: 30 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=batch_${batchId}_students.pdf`);

    // Header
    doc.fontSize(18).text("Batch Student List (Subject-wise + Overall Attendance)", { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(`Batch: ${batch.name}`);
    doc.text(`Department: ${batch.department}`);
    doc.text(`Year: ${batch.year}`);
    doc.moveDown();

    // Table-like format
    doc.fontSize(14).text("Students", { underline: true });
    for (const student of batch.students as any[]) {
      const { subjectAttendance, overall } = await getStudentAttendance(student._id, batch.subjects as any[]);
      doc.fontSize(12).text(`${student.rollNumber} - ${student.name} (${student.email || "N/A"})`);
      batch.subjects.forEach((sub: any) => {
        doc.text(`   ${sub.name}: ${subjectAttendance[sub.name]}%`);
      });
      doc.text(`   Overall: ${overall}%`);
      doc.moveDown();
    }

    doc.end();
    doc.pipe(res);
  } catch (err: any) {
    res.status(500).json({ msg: "Server Error", error: err.message });
  }
};