import { Request, Response } from "express";
import Assignment from "../models/assessment.model";
import Subject from "../models/subject.model";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";

// @desc Create new assignment
export const createAssignment = async (req: Request, res: Response) => {
  try {
    const { title, description, subjectId, batchId, teacherId, dueDate, maxMarks, attachments } = req.body;

    const assignment = new Assignment({
      title,
      description,
      subject: subjectId,
      batch: batchId,
      teacher: teacherId,
      dueDate,
      maxMarks,
      attachments
    });

    await assignment.save();

    await Subject.findByIdAndUpdate(subjectId, { $push: { assignments: assignment._id } });

    res.status(201).json({ msg: "Assignment created successfully", assignment });
  } catch (err: any) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

// @desc Get assignments for a subject
export const getAssignments = async (req: Request, res: Response) => {
  try {
    const { subjectId } = req.params;
    const assignments = await Assignment.find({ subject: subjectId })
      .populate("teacher", "name email")
      .populate("batch", "name");
    res.json(assignments);
  } catch (err: any) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

// @desc Student submits assignment
export const submitAssignment = async (req: Request, res: Response) => {
  try {
    const { assignmentId } = req.params;
    const { studentId, fileUrl } = req.body;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) return res.status(404).json({ msg: "Assignment not found" });

    const existingSubmission = assignment.submissions.find(sub => sub.student.toString() === studentId);
    if (existingSubmission) {
      existingSubmission.submittedAt = new Date();
      existingSubmission.fileUrl = fileUrl;
      existingSubmission.status = "Submitted";
    } else {
      assignment.submissions.push({
        student: studentId,
        submittedAt: new Date(),
        fileUrl,
        status: "Submitted"
      });
    }

    await assignment.save();

    res.json({ msg: "Assignment submitted successfully", assignment });
  } catch (err: any) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

// @desc Teacher grades submission
export const gradeSubmission = async (req: Request, res: Response) => {
  try {
    const { assignmentId, studentId } = req.params;
    const { marks, remarks } = req.body;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) return res.status(404).json({ msg: "Assignment not found" });

    const submission = assignment.submissions.find(sub => sub.student.toString() === studentId);
    if (!submission) return res.status(404).json({ msg: "Submission not found" });

    submission.marks = marks;
    submission.remarks = remarks;
    submission.status = "Graded";

    await assignment.save();

    res.json({ msg: "Submission graded", assignment });
  } catch (err: any) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

// 🔹 Export Assignment Report → Excel
export const exportAssignmentExcel = async (req: Request, res: Response) => {
  try {
    const { assignmentId } = req.params;
    const assignment = await Assignment.findById(assignmentId)
      .populate("subject", "name code")
      .populate("batch", "name department year")
      .populate("teacher", "name email")
      .populate("submissions.student", "name rollNumber email");

    if (!assignment) return res.status(404).json({ msg: "Assignment not found" });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Assignment Report");

    // Title
    sheet.addRow(["Assignment Report"]);
    sheet.addRow([`Title: ${assignment.title}`]);
    sheet.addRow([`Subject: ${(assignment.subject as any)?.name} (${(assignment.subject as any)?.code})`]);
    sheet.addRow([`Batch: ${(assignment.batch as any)?.name} - ${(assignment.batch as any)?.department}`]);
    sheet.addRow([`Teacher: ${(assignment.teacher as any)?.name} (${(assignment.teacher as any)?.email})`]);
    sheet.addRow([`Due Date: ${assignment.dueDate.toDateString()}`]);
    sheet.addRow([]);
    
    // Headers
    sheet.addRow(["Roll No", "Name", "Email", "Status", "Marks", "Remarks", "Submitted At"]);

    // Submissions
    for (const sub of assignment.submissions as any[]) {
      sheet.addRow([
        sub.student.rollNumber,
        sub.student.name,
        sub.student.email,
        sub.status,
        sub.marks ?? "-",
        sub.remarks ?? "-",
        sub.submittedAt ? new Date(sub.submittedAt).toLocaleString() : "-"
      ]);
    }

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=assignment_${assignmentId}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err: any) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

// 🔹 Export Assignment Report → DF
export const exportAssignmentPDF = async (req: Request, res: Response) => {
  try {
    const { assignmentId } = req.params;
    const assignment = await Assignment.findById(assignmentId)
      .populate("subject", "name code")
      .populate("batch", "name department year")
      .populate("teacher", "name email")
      .populate("submissions.student", "name rollNumber email");

    if (!assignment) return res.status(404).json({ msg: "Assignment not found" });

    const doc = new PDFDocument({ margin: 30 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=assignment_${assignmentId}.pdf`);

    // Header
    doc.fontSize(18).text("Assignment Report", { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(`Title: ${assignment.title}`);
    doc.text(`Subject: ${(assignment.subject as any)?.name} (${(assignment.subject as any)?.code})`);
    doc.text(`Batch: ${(assignment.batch as any)?.name} - ${(assignment.batch as any)?.department}`);
    doc.text(`Teacher: ${(assignment.teacher as any)?.name} (${(assignment.teacher as any)?.email})`);
    doc.text(`Due Date: ${assignment.dueDate.toDateString()}`);
    doc.moveDown();

    // Submissions Table
    doc.fontSize(14).text("Submissions", { underline: true });
    doc.moveDown();

    for (const sub of assignment.submissions as any[]) {
      doc.fontSize(12).text(`${sub.student.rollNumber} - ${sub.student.name} (${sub.student.email})`);
      doc.text(`   Status: ${sub.status}`);
      doc.text(`   Marks: ${sub.marks ?? "-"}`);
      doc.text(`   Remarks: ${sub.remarks ?? "-"}`);
      doc.text(`   Submitted At: ${sub.submittedAt ? new Date(sub.submittedAt).toLocaleString() : "-"}`);
      doc.moveDown();
    }

    doc.end();
    doc.pipe(res);
  } catch (err: any) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

// 🔹 Export Batch Assignment Summary with Averages → Excel
export const exportBatchAssignmentsExcel = async (req: Request, res: Response) => {
  try {
    const { batchId } = req.params;
    const assignments = await Assignment.find({ batch: batchId })
      .populate("subject", "name code")
      .populate("teacher", "name email")
      .populate("submissions.student", "name rollNumber email");

    if (!assignments.length) {
      return res.status(404).json({ msg: "No assignments found for this batch" });
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Batch Assignments");

    // Title
    sheet.addRow(["Batch Assignment Summary"]);
    sheet.addRow([`Batch ID: ${batchId}`]);
    sheet.addRow([`Total Assignments: ${assignments.length}`]);
    sheet.addRow([]);

    // Headers
    sheet.addRow([
      "Assignment Title",
      "Subject",
      "Teacher",
      "Student Roll No",
      "Student Name",
      "Email",
      "Status",
      "Marks",
      "Remarks",
      "Submitted At"
    ]);

    // Map to track student totals
    const studentPerformance: Record<string, { name: string; roll: string; email: string; total: number; count: number }> = {};

    // Rows
    for (const assignment of assignments) {
      for (const sub of assignment.submissions as any[]) {
        sheet.addRow([
          assignment.title,
          (assignment.subject as any)?.name,
          (assignment.teacher as any)?.name,
          sub.student?.rollNumber,
          sub.student?.name,
          sub.student?.email,
          sub.status,
          sub.marks ?? "-",
          sub.remarks ?? "-",
          sub.submittedAt ? new Date(sub.submittedAt).toLocaleString() : "-"
        ]);

        if (sub.marks !== undefined) {
          const key = sub.student._id.toString();
          if (!studentPerformance[key]) {
            studentPerformance[key] = {
              name: sub.student?.name,
              roll: sub.student?.rollNumber,
              email: sub.student?.email,
              total: 0,
              count: 0
            };
          }
          studentPerformance[key].total += sub.marks;
          studentPerformance[key].count += 1;
        }
      }
    }

    // Averages Section
    sheet.addRow([]);
    sheet.addRow(["Student Averages"]);
    sheet.addRow(["Roll No", "Name", "Email", "Average Marks"]);

    for (const studentId in studentPerformance) {
      const s = studentPerformance[studentId];
      const avg = s.count > 0 ? (s.total / s.count).toFixed(2) : "-";
      sheet.addRow([s.roll, s.name, s.email, avg]);
    }

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=batch_${batchId}_assignments.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err: any) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

// 🔹 Export Batch Assignment Summary with Averages → PDF
export const exportBatchAssignmentsPDF = async (req: Request, res: Response) => {
  try {
    const { batchId } = req.params;
    const assignments = await Assignment.find({ batch: batchId })
      .populate("subject", "name code")
      .populate("teacher", "name email")
      .populate("submissions.student", "name rollNumber email");

    if (!assignments.length) {
      return res.status(404).json({ msg: "No assignments found for this batch" });
    }

    const doc = new PDFDocument({ margin: 30 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=batch_${batchId}_assignments.pdf`);

    // Header
    doc.fontSize(18).text("Batch Assignment Summary", { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(`Batch ID: ${batchId}`);
    doc.text(`Total Assignments: ${assignments.length}`);
    doc.moveDown();

    const studentPerformance: Record<string, { name: string; roll: string; email: string; total: number; count: number }> = {};

    for (const assignment of assignments) {
      doc.fontSize(14).text(`📘 ${assignment.title}`, { underline: true });
      doc.fontSize(12).text(`Subject: ${(assignment.subject as any)?.name}`);
      doc.text(`Teacher: ${(assignment.teacher as any)?.name} (${(assignment.teacher as any)?.email})`);
      doc.text(`Due Date: ${assignment.dueDate.toDateString()}`);
      doc.moveDown();

      for (const sub of assignment.submissions as any[]) {
        doc.text(`${sub.student?.rollNumber} - ${sub.student?.name} (${sub.student?.email})`);
        doc.text(`   Status: ${sub.status}`);
        doc.text(`   Marks: ${sub.marks ?? "-"}`);
        doc.text(`   Remarks: ${sub.remarks ?? "-"}`);
        doc.text(`   Submitted At: ${sub.submittedAt ? new Date(sub.submittedAt).toLocaleString() : "-"}`);
        doc.moveDown();

        if (sub.marks !== undefined) {
          const key = sub.student._id.toString();
          if (!studentPerformance[key]) {
            studentPerformance[key] = {
              name: sub.student?.name,
              roll: sub.student?.rollNumber,
              email: sub.student?.email,
              total: 0,
              count: 0
            };
          }
          studentPerformance[key].total += sub.marks;
          studentPerformance[key].count += 1;
        }
      }

      doc.moveDown();
    }

    // Averages Section
    doc.addPage();
    doc.fontSize(16).text("📊 Student Average Marks", { underline: true, align: "center" });
    doc.moveDown();

    for (const studentId in studentPerformance) {
      const s = studentPerformance[studentId];
      const avg = s.count > 0 ? (s.total / s.count).toFixed(2) : "-";
      doc.fontSize(12).text(`${s.roll} - ${s.name} (${s.email}) → Avg: ${avg}`);
      doc.moveDown(0.5);
    }

    doc.end();
    doc.pipe(res);
  } catch (err: any) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};