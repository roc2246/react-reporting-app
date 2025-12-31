// src/pages/SevenDayVolumeReport.jsx
import { useEffect, useState } from "react";
import * as fetchLib from "../utils/fetch-library";
import LoadingMssg from "../components/LoadingMssg";
import { Table } from "../table/Table";

const SevenDayVolumeReport = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // ----------------- FETCH DATA -----------------
  useEffect(() => {
    const fetchData = async () => {
      try {
        const json = await fetchLib.fetchJSON("/api/weeks-volumes-report");
        setData(json);
      } catch (err) {
        console.error("Error fetching 7-day volume report:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // ----------------- HELPERS -----------------

  if (loading) return <LoadingMssg bool={loading} />;

  if (!data || data.length === 0) {
    return <h1 className="_7-day-volumes-report__status">No data available</h1>;
  }

  const keys = Object.keys(data[0]).filter((key) => key !== "productionDay");

  const className = "_7-day-volumes-report";
  // ----------------- RENDER -----------------
  return (
    <section className={className}>
      <h1 className={`${className}__heading`}>
        7 Day Historical Order Que
      </h1>
      <Table className={className} data={data} keys={keys} />
    </section>
  );
};

export default SevenDayVolumeReport;
