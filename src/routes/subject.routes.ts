import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import {
  createSubject,
  getBatchSubjects,
  updateSubject,
  deleteSubject,
  getSubjects,
  getSubject
} from "../controllers/subject.controller";

const router = Router();

router.get('/', authMiddleware, getSubjects);
router.post("/create", authMiddleware, createSubject);
router.get("/batch/:batchId", authMiddleware, getBatchSubjects);
router.get("/:subjectId", authMiddleware, getSubject);
router.put("/:subjectId", authMiddleware, updateSubject);
router.delete("/:subjectId", authMiddleware, deleteSubject);

export default router;
