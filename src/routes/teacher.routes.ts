import { Router } from "express";
import { registerTeacher, loginTeacher, getDetails, updateDetails } from "../controllers/teacher.controller";
import validate from "../middleware/validate";
import { registerTeacherSchema, loginTeacherSchema } from "../validations/teacher.validation";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.get("/", authMiddleware, getDetails);
// @route   POST /api/teachers/register
router.post("/register", validate(registerTeacherSchema), registerTeacher);

// @route   POST /api/teachers/login
router.post("/login", validate(loginTeacherSchema), loginTeacher);

// @route   PUT /api/teachers/login
router.put("/update", authMiddleware, updateDetails);


export default router;
