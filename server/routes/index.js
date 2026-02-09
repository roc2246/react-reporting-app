// /server/routes/index.js
import express from "express";
import * as controllers from "../controllers/index.js";

const router = express.Router();

// ----- AUTH -----
router.post("/login", controllers.login);
router.post("/logout", controllers.logout);

// ----- ORDERS -----
router.get("/recover-orders", controllers.recoverData);
router.get("/awaiting-shipment", controllers.awaitingShipment);
router.get("/data-from-day", controllers.dataOfDay);
router.get("/data-on-fly", controllers.totalsOnFly);

// ----- SUMMARIES -----
router.get("/summarized-range", controllers.getSummarizedRange);
router.get("/historical-range", controllers.manageHistoricalRange);
router.get("/order-volumes-report", controllers.getOrderVolumesReport);
router.get("/weeks-volumes-report", controllers.getWeeksVolumesReport);
router.get("/production-dates", controllers.getProductionDates);
router.get("/que-dates", controllers.getQueDates);

// ----- DOWNLOADS -----
router.get("/download-report", controllers.downloadRangeSummary);
router.get("/download-ids", controllers.downloadOrderIDs);
router.get("/download-range", controllers.downloadHistoricalRange);

// ----- HOURS & FBA -----
router.put("/load-hours", controllers.loadHours);
router.put("/total-hours", controllers.includeTotalHours);
router.put("/FBA", controllers.includeFBA);

// ----- WEBHOOK -----
router.post("/webhook/on-items-shipped", controllers.manageShipmentsNotified);

export default router;
