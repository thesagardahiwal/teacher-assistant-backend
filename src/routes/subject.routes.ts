import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import {
  createSubject,
  getBatchSubjects,
  updateSubject,
  deleteSubject
} from "../controllers/subject.controller";

const router = Router();

router.post("/create", authMiddleware, createSubject);
router.get("/:batchId", authMiddleware, getBatchSubjects);
router.put("/:subjectId", authMiddleware, updateSubject);
router.delete("/:subjectId", authMiddleware, deleteSubject);

export default router;
