import { Router } from "express";
import { registerTeacher, loginTeacher } from "../controllers/teacher.controller";
import validate from "../middleware/validate";
import { registerTeacherSchema, loginTeacherSchema } from "../validations/teacher.validation";

const router = Router();

// @route   POST /api/teachers/register
router.post("/register", validate(registerTeacherSchema), registerTeacher);

// @route   POST /api/teachers/login
router.post("/login", validate(loginTeacherSchema), loginTeacher);

export default router;
