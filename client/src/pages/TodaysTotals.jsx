// src/pages/TodaysTotals.jsx
import { useState, useEffect } from "react";
import Controll from "../components/Controll";
import TotalsReport from "../sections/TotalsReport";
import LoadingMssg from "../components/LoadingMssg";
import ExcellDownloads from "../sections/ExcellDownloads";
import * as fetchLib from "../utils/fetch-library";
import Input from "../components/Input";

const TodaysTotals = () => {
  // ----------------- STATE -----------------
  const [date, setDate] = useState("");
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);

  // ----------------- EFFECTS -----------------
  // Set default date to today in Eastern Time
  useEffect(() => {
    const currentDate = new Date();
    const offsetMinutes = currentDate.getTimezoneOffset();
    currentDate.setMinutes(currentDate.getMinutes() - offsetMinutes - 300);
    setDate(currentDate.toISOString().split("T")[0]);
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
      <section className="report-generation">
        <form
          className="report-generation__form"
          onSubmit={handleGenerateReport}
        >
          <Controll
            htmlFor="dates"
            label="Date:"
            type="date"
            onChange={(e) => setDate(e.target.value)}
          />
          <Input className="report-generation" value="Generate Report" />
        </form>

        <ExcellDownloads date={date} />
      </section>

      <LoadingMssg bool={loading} />

      <TotalsReport data={reportData} />
    </div>
  );
};

export default TodaysTotals;
