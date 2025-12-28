// src/pages/TodaysTotals.jsx
import { useState, useEffect } from "react";
import Controll from "../components/Controll";
import TotalsReport from "../sections/TotalsReport";
import LoadingMssg from "../components/LoadingMssg";
import ExcellDownloads from "../sections/ExcellDownloads";
import * as fetchLib from "../utils/fetch-library";
import Input from "../components/Input";
import * as dateLib from "../utils/date-library";

const TodaysTotals = () => {
  // ----------------- STATE -----------------
  const [date, setDate] = useState("");
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);

  // ----------------- EFFECTS -----------------
  // Set default date to today in Eastern Time
  useEffect(() => {
    const currentDate = dateLib.getTodayInTimezone(-300);
    setDate(currentDate);
  }, []);

  // ----------------- HANDLERS -----------------

  const handleGenerateReport = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await fetchLib.fetchJSON(`/api/data-on-fly?date=${date}`);
      const reportRows = Object.entries(data);
      setReportData(reportRows);
    } catch (err) {
      console.error("Error fetching report:", err);
    } finally {
      setLoading(false);
    }
  };

  // ----------------- RENDER -----------------
  return (
    <div className="todays-totals-page">
      <h1 className="todays-totals-page__heading">In-Day Estimate</h1>
      <form className="report-generation" onSubmit={handleGenerateReport}>
        <Controll htmlFor="date" onChange={(e) => setDate(e.target.value)} />
        <Input className="report-generation" value="Generate Report" />
      </form>
      <ExcellDownloads date={date} />
      <LoadingMssg bool={loading} />
      <TotalsReport data={reportData} />
    </div>
  );
};

export default TodaysTotals;
