import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import {
  markTeacherAttendance,
  getTeacherAttendanceByDate,
  getTeacherAttendanceSummary
} from "../controllers/teacherAttendance.controller";

const router = Router();

// @route POST /api/teacher-attendance/mark
router.post("/mark", authMiddleware, markTeacherAttendance);

// @route GET /api/teacher-attendance/date/:date
router.get("/date/:date", authMiddleware, getTeacherAttendanceByDate);

// @route GET /api/teacher-attendance/summary/:teacherId
router.get("/summary/:teacherId", authMiddleware, getTeacherAttendanceSummary);

export default router;
