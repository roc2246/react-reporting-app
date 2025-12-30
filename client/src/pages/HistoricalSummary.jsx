import { useState, useEffect } from "react";
import Select from "../components/Select";
import LoadingMssg from "../components/LoadingMssg";
import ExcellDownloads from "../components/ExcellDownloads";
import * as fetchLib from "../utils/fetch-library";
import ReportGeneration from "../components/ReportGeneration";
import * as reportLib from "../utils/report-library";

export default function HistoricalSummary() {
  // ----------------- STATE -----------------
  const [productionDates, setProductionDates] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reportData, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  // ----------------- EFFECTS -----------------
  useEffect(() => {
    const fetchProductionDates = async () => {
      try {
        const data = await fetchLib.fetchJSON("/production-dates");
        const reversed = data.reverse();

        setProductionDates(reversed);
        if (reversed.length > 0) {
          setStartDate(reversed[0]);
          setEndDate(reversed[reversed.length - 1]);
        }
      } catch (err) {
        console.error("Error fetching production dates:", err);
      }
    };

    fetchProductionDates();
  }, []);

  // ----------------- HELPERS -----------------
  const createRowData = (grandTotals) =>
    Object.entries(grandTotals).map(([key, value]) => ({ key, value }));

  const handleGenerateReport = async (e) => {
    reportLib.validateRange(startDate, endDate);
    e.preventDefault();
    setLoading(true);

    try {
      const data = await fetchLib.fetchJSON(
        `/summarized-range?startDate=${startDate}&endDate=${endDate}`
      );

      const grandTotals = reportLib.grandTottals(startDate, endDate, data);

      setData(createRowData(grandTotals));
    } catch (err) {
      console.error("Error generating report:", err);
    } finally {
      setLoading(false);
    }
  };
  const className = "historical-summary";

  // ----------------- RENDER -----------------
  return (
    <section className={className}>
      <h1 className={`${className}__heading`}>Historical Summary</h1>
      <form
        className={`${className}__form`}
        onSubmit={handleGenerateReport}
      >
        <Select
          label="Start:"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          options={productionDates}
        />

        <Select
          label="End:"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          options={productionDates}
        />

        <ReportGeneration
          className={className}
          handleGenerateReport={handleGenerateReport}
        />
        <Input className={className} value="Generate Report" />
      </form>
      <ExcellDownloads startDate={startDate} endDate={endDate} />
      <LoadingMssg bool={loading} />
      {!loading && (
        <div className={`${className}__data`}>
          {reportData.map((row) => (
            <span key={row.key} className={`${className}__row`}>
              <h4 className={`${className}__product-name`}>{row.key}</h4>
              <p className={`${className}__product-count`}>{row.value}</p>
            </span>
          ))}
        </div>
      )}
    </section>
  );
}
