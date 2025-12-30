import { useEffect, useState } from "react";
import LoadingMssg from "../components/LoadingMssg";

import Select from "../components/Select";
import * as fetchLib from "../utils/fetch-library";
import * as dateLib from "../utils/date-library";
import { Table } from "../table/Table";

const OrderVolumesReport = () => {
  const [dates, setDates] = useState([]);
  const [dayOfWeek, setDayOfWeek] = useState("sunday");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const weekdays = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];

  // ----------------- FETCH DATES -----------------
  useEffect(() => {
    const fetchDates = async () => {
      try {
        const json = await fetchLib.fetchJSON("/que-dates");
        setDates(json.reverse());
        if (json.length > 0) {
          setStartDate(json[json.length - 1]);
          setEndDate(json[0]);
        }
      } catch (err) {
        console.error("Error fetching dates:", err);
      }
    };
    fetchDates();
  }, []);

  // ----------------- GENERATE REPORT -----------------
  const handleGenerateReport = async () => {
    if (!startDate || !endDate) return;

    const adjustedStart = dateLib.closestDayOfWeek(startDate, dayOfWeek);
    setLoading(true);

    try {
      const url = `/order-volumes-report?startDate=${adjustedStart}&endDate=${endDate}`;
      const json = await fetchLib.fetchJSON(url);
      setData(json);
    } catch (err) {
      console.error("Error fetching report:", err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // ----------------- HELPERS -----------------
  const keys = data[0]
    ? Object.keys(data[0]).filter((key) => key !== "productionDay")
    : [];
  const className = "order-volumes-report";

  // ----------------- RENDER -----------------
  return (
    <section className="order-volumes-report">
      <h1 className="order-volumes-report__heading">
        Generate Historical Range Report
      </h1>

      <Select
        label="Day of Week:"
        value={dayOfWeek}
        onChange={(e) => setDayOfWeek(e.target.value)}
        options={weekdays.map(
          (day) => day.charAt(0).toUpperCase() + day.slice(1)
        )}
        className="order-volumes-report__day-of-week"
      />

      <Select
        label="Report Start Date:"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
        options={dates}
        className="order-volumes-report__start"
      />

      <Select
        label="Report End Date:"
        value={endDate}
        onChange={(e) => setEndDate(e.target.value)}
        options={dates}
        className="order-volumes-report__end"
      />
      <ReportGeneration
        className="order-volumes-report"
        handleGenerateReport={handleGenerateReport}
      />

      <LoadingMssg bool={loading} />

      {data.length > 0 && (
        <Table className={className} data={data} keys={keys} />
      )}
    </section>
  );
};

export default OrderVolumesReport;
