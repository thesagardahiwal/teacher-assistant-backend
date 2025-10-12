import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { importStudent, importStudents } from "../controllers/student.controller";

const router = Router();

// @route   POST /api/students/import
// @desc    Import students via JSON
router.post("/", authMiddleware, importStudent);
router.post("/import", authMiddleware, importStudents);

export default router;
