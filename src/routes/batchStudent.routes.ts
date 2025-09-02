import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import {
  importStudentsToBatch,
  addStudentToBatch,
  removeStudentFromBatch
} from "../controllers/student.controller";

const router = Router();

// Bulk import
router.post("/:batchId/import", authMiddleware, importStudentsToBatch);

// Add single student
router.post("/:batchId/add", authMiddleware, addStudentToBatch);

// Remove student
router.delete("/:batchId/:studentId", authMiddleware, removeStudentFromBatch);

export default router;
