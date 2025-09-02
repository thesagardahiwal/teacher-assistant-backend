import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { getTeacherPerformance } from "../controllers/teacherPerformance.controller";

const router = Router();

// @route GET /api/teacher-performance/:teacherId
// @desc  Get teacher performance report
router.get("/:teacherId", authMiddleware, getTeacherPerformance);

export default router;
