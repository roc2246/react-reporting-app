// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MainPage from "./pages/MainPage.jsx";
import TodaysTotals from "./pages/TodaysTotals.jsx";
import HistoricalRange from "./pages/HistoricalRange.jsx";
import HistoricalSummary from "./pages/HistoricalSummary.jsx";
// import SevenDayReport from "./pages/SevenDayReport.jsx";
// import OrderVolumesReport from "./pages/OrderVolumesReport.jsx";
// import RecordHours from "./pages/RecordHours.jsx";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainPage />} />
      <Route path="/todays-totals" element={<TodaysTotals />} />
        <Route path="/historical-range" element={<HistoricalRange />} />
        <Route path="/historical-summary" element={<HistoricalSummary />} />
        {/* <Route path="/7-day-volume-report" element={<SevenDayReport />} /> */}
        {/* <Route path="/order-volumes-report" element={<OrderVolumesReport />} /> */}
        {/* <Route path="/record-hours" element={<RecordHours />} /> */}
      </Routes>
    </Router>
  );
};

export default App;
