import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import {
  createBatch,
  getBatchById,
  updateBatch,
  deleteBatch,
  getAllBatches,
  exportBatchExcel,
  exportBatchPDF,
  exportBatchStudentsExcel,
  exportBatchStudentsPDF
} from "../controllers/batch.controller";

const router = Router();

router.post("/", authMiddleware, createBatch);
router.get("/", authMiddleware, getAllBatches);
router.get("/:batchId", authMiddleware, getBatchById);
router.put("/:batchId", authMiddleware, updateBatch);
router.delete("/:batchId", authMiddleware, deleteBatch);

// Exports
router.get("/:batchId/excel", authMiddleware, exportBatchExcel);
router.get("/:batchId/pdf", authMiddleware, exportBatchPDF);
// Export student list with attendance
router.get("/:batchId/students/excel", authMiddleware, exportBatchStudentsExcel);
router.get("/:batchId/students/pdf", authMiddleware, exportBatchStudentsPDF);

export default router;
