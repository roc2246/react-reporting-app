import { useState, useEffect } from "react";
import Select from "../components/Select";
import LoadingMssg from "../components/LoadingMssg";
import ExcellDownloads from "../components/ExcellDownloads";
import * as fetchLib from "../utils/fetch-library";
import ReportGeneration from "../components/ReportGeneration";
import * as reportLib from "../utils/report-library";

const HistoricalSummary = () => {
  // ----------------- STATE -----------------
  const [productionDates, setProductionDates] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reportData, setData] = useState([]);
  const [showDropdown, setShowDropdown] = useState(true);
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

  const handleGenerateReport = async () => {
    reportLib.validateRange(startDate, endDate);

    setShowDropdown(false);
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

  const handleBack = () => {
    setShowDropdown(true);
    setData([]);
  };

  // ----------------- RENDER -----------------
  return (
    <div className="historical-summary-page">
      <section className="historical-summary">
        <h1 className="historical-summary__heading">Historical Summary</h1>

        {!showDropdown && (
          <button className="historical-summary__back" onClick={handleBack}>
            Back
          </button>
        )}

        <LoadingMssg bool={loading} />

        {!showDropdown && (
          <div className="historical-summary__data">
            {reportData.map((row) => (
              <span key={row.key} className="historical-summary__row">
                <h4 className="historical-summary__product-name">{row.key}</h4>
                <p className="historical-summary__product-count">{row.value}</p>
              </span>
            ))}

            <ExcellDownloads startDate={startDate} endDate={endDate} />
          </div>
        )}

        {showDropdown && (
          <section className="historical-summary__dates">
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
              className="historical-summary"
              handleGenerateReport={handleGenerateReport}
            />
          </section>
        )}
      </section>
    </div>
  );
};

export default HistoricalSummary;
