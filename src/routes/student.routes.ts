import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { importStudents } from "../controllers/student.controller";
import validate from "../middleware/validate";
import { studentArraySchema } from "../validations/student.validation";

const router = Router();

// @route   POST /api/students/import
// @desc    Import students via JSON
router.post("/import", authMiddleware, validate(studentArraySchema), importStudents);

export default router;
