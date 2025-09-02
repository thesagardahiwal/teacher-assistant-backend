import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { exportBatchAttendance, exportBatchAttendancePDF, getAttendanceByLecture, getBatchAttendanceAnalytics, getBatchAttendanceSummary, getStudentAttendanceSummary, markAttendance } from "../controllers/attendance.controller";

const router = Router();

// @route POST /api/attendance/mark
// @desc  Mark attendance for a session
router.post("/mark", authMiddleware, markAttendance);

// @route GET /api/attendance/:lectureSessionId
// @desc  Get attendance details for a lecture
router.get("/:lectureSessionId", authMiddleware, getAttendanceByLecture);

// @route GET /api/attendance/student/:studentId
// @desc  Get overall attendance summary for a student
router.get("/student/:studentId", authMiddleware, getStudentAttendanceSummary);

// @route GET /api/attendance/batch/:batchId
// @desc  Get attendance summary for a batch (with optional ?subjectId=)
// Example: /api/attendance/batch/67a1c9...?subjectId=67a1d1...
router.get("/batch/:batchId", authMiddleware, getBatchAttendanceSummary);

// @route GET /api/attendance/batch/:batchId/export?format=xlsx&subjectId=...
// @desc  Export batch attendance summary as Excel/CSV
router.get("/batch/:batchId/export", authMiddleware, exportBatchAttendance);

// @route GET /api/attendance/batch/:batchId/export/pdf?subjectId=...
// @desc  Export batch attendance summary as PDF (with chart)
router.get("/batch/:batchId/export/pdf", authMiddleware, exportBatchAttendancePDF);

// @route GET /api/attendance/batch/:batchId/analytics?subjectId=...
// @desc  Get batch attendance analytics (top/low performers, averages, distribution)
router.get("/batch/:batchId/analytics", authMiddleware, getBatchAttendanceAnalytics);

export default router;
