// /server/routes/index.js
import express from "express";
import * as controllers from "../controllers/index.js";
// import middleware from "../middleware/index.js"; // optional, uncomment if needed

const router = express.Router();

// ----- AUTH -----
router.post("/login", (req, res) => {
  controllers.login(req, res);
});

router.post("/logout", (req, res) => {
  controllers.logout(req, res);
});

// ----- ORDERS -----
router.get("/recover-orders", /* middleware.rateLimitMiddleware, */ (req, res) => {
  const page = req.query.page;
  const date = req.query.date;
  controllers.recoverData(req, res, page, date);
});

router.get("/awaiting-shipment", /* middleware.rateLimitMiddleware, */ (req, res) => {
  const page = req.query.page;
  controllers.awaitingShipment(req, res, page);
});

router.get("/data-from-day", (req, res) => {
  controllers.dataOfDay(req, res);
});

router.get("/data-on-fly", (req, res) => {
  controllers.totalsOnFly(req, res);
});

// ----- SUMMARIES -----
router.get("/summarized-range", (req, res) => {
  const startDate = req.query.startDate;
  const endDate = req.query.endDate;
  controllers.getSummarizedRange(req, res, startDate, endDate);
});

router.get("/historical-range", (req, res) => {
  const startDate = req.query.startDate;
  const endDate = req.query.endDate;
  controllers.manageHistoricalRange(req, res, startDate, endDate);
});

router.get("/order-volumes-report", (req, res) => {
  const startDate = req.query.startDate;
  const endDate = req.query.endDate;
  controllers.getOrderVolumesReport(req, res, startDate, endDate);
});

router.get("/weeks-volumes-report", (req, res) => {
  controllers.getWeeksVolumesReport(req, res);
});

router.get("/production-dates", (req, res) => {
  controllers.getProductionDates(req, res);
});

router.get("/que-dates", (req, res) => {
  controllers.getQueDates(req, res);
});

// ----- DOWNLOADS -----
router.get("/download-report", (req, res) => {
  const startDate = req.query.startDate;
  const endDate = req.query.endDate;
  controllers.downloadRangeSummary(req, res, startDate, endDate);
});

router.get("/download-ids", (req, res) => {
  const startDate = req.query.startDate;
  const endDate = req.query.endDate;
  controllers.downloadOrderIDs(req, res, startDate, endDate);
});

router.get("/download-range", (req, res) => {
  const startDate = req.query.startDate;
  const endDate = req.query.endDate;
  controllers.downloadHistoricalRange(req, res, startDate, endDate);
});

// ----- HOURS & FBA -----
router.put("/load-hours", (req, res) => {
  controllers.loadHours(req, res);
});

router.put("/total-hours", (req, res) => {
  controllers.includeTotalHours(req, res);
});

router.put("/FBA", (req, res) => {
  controllers.includeFBA(req, res);
});

// ----- WEBHOOK -----
router.post("/webhook/on-items-shipped", (req, res) => {
  controllers.manageShipmentsNotified(req, res);
});

export default router;
