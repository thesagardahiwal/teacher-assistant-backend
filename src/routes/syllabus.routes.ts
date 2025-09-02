import { Router } from "express";
import { createSyllabus, markTopicCompleted, getSyllabusProgress } from "../controllers/syllabus.controller";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.post("/", authMiddleware, createSyllabus);
router.patch("/:syllabusId/module/:moduleIndex/topic/:topicIndex/complete", authMiddleware, markTopicCompleted);
router.get("/:syllabusId/progress", authMiddleware, getSyllabusProgress);

export default router;
