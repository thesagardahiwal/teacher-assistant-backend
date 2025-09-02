import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import {
  createAssignment,
  getAssignments,
  submitAssignment,
  gradeSubmission,
  exportAssignmentExcel,
  exportAssignmentPDF,
  exportBatchAssignmentsExcel,
  exportBatchAssignmentsPDF
} from "../controllers/assignment.controller";

const router = Router();

// Teacher creates assignment
router.post("/create", authMiddleware, createAssignment);

// Get all assignments of a subject
router.get("/:subjectId", authMiddleware, getAssignments);

// Student submits assignment
router.post("/:assignmentId/submit", authMiddleware, submitAssignment);

// Teacher grades submission
router.post("/:assignmentId/grade/:studentId", authMiddleware, gradeSubmission);

// Export assignment reports
router.get("/:assignmentId/export/excel", authMiddleware, exportAssignmentExcel);
router.get("/:assignmentId/export/pdf", authMiddleware, exportAssignmentPDF);

// Batch-level assignment summary with averages
router.get("/batch/:batchId/export/excel", authMiddleware, exportBatchAssignmentsExcel);
router.get("/batch/:batchId/export/pdf", authMiddleware, exportBatchAssignmentsPDF);

export default router;
