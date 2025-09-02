import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import {
  getBatchAnalytics,
  exportBatchAnalyticsExcel,
  exportBatchAnalyticsPDF
} from "../controllers/batchAnalytics.controller";

const router = Router();

// JSON Report
router.get("/:batchId", authMiddleware, getBatchAnalytics);

// Excel Export
router.get("/:batchId/excel", authMiddleware, exportBatchAnalyticsExcel);

// PDF Export
router.get("/:batchId/pdf", authMiddleware, exportBatchAnalyticsPDF);

export default router;
