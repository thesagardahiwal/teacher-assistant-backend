import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { createLectureSession, getMyLectureSessions, updateLectureSession } from "../controllers/lecture.controller";

const router = Router();

// @route POST /api/lectures/create
// @desc  Create a new lecture session
router.post("/create", authMiddleware, createLectureSession);

// @route GET /api/lectures/my
// @desc  Get all lecture sessions of logged-in teacher
router.get("/my", authMiddleware, getMyLectureSessions);

// @route PUT /api/lectures/update
// @desc  Update a lecture session
router.put("/update", authMiddleware, updateLectureSession); 
export default router;
