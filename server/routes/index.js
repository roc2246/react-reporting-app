const express = require("express");
const router = express.Router();
const controllers = require("../../controllers/index");
const middleware = require("../middleware/index");

router.post("/login", (req, res) => {
  controllers.login(req, res);
});

router.post("/logout", (req, res) => {
  controllers.logout(req, res);
});

router.get("/pull-orders", /* middleware.rateLimitMiddleware, */ (req, res) => {
  const page = req.query.page;
  controllers.archiveOrders(req, res, page);
});

// MODIFY LATER ONCE WEBHOOK HAS BEEN CONFIGURED
router.post("/webhook/on-items-shipped", (req, res) => {
  controllers.manageShipmentsNotified(req, res);
});

router.get("/recover-orders", /* middleware.rateLimitMiddleware, */ (req, res) => {
  const page = req.query.page;
  const date = req.query.date
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
  const date = req.query.date;
  controllers.totalsOnFly(req, res, date);
});

// MAY REMOVE LATER IF WEBSOCKET FUNCTIONALITY IS IMPLEMENTED
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

router.put("/load-hours", (req, res) => {
  controllers.loadHours(req, res);
});

// MIGHT USE FOR WEBSOCKET INSTEAD LATER
router.put("/total-hours", (req, res) => {
  controllers.includeTotalHours(req, res);
});

// MIGHT USE FOR WEBSOCKET INSTEAD LATER
router.put("/FBA", (req, res) => {
  controllers.includeFBA(req, res);
});

module.exports = router;
