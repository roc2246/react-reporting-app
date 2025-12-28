// src/pages/RecordHours.jsx
import React, { useEffect, useState } from "react";
import Controll from "../components/Controll";
import * as fetchLib from "../utils/fetch-library";


const RecordHours = () => {
  const [dates, setDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [FBA, setFBA] = useState("");
  const [totalHours, setTotalHours] = useState("");
  const [loadingFBA, setLoadingFBA] = useState(false);
  const [loadingHours, setLoadingHours] = useState(false);
  const [file, setFile] = useState(null);

  // Fetch available dates
  useEffect(() => {
    const fetchDates = async () => {
      try {
        const json = await fetchLib.fetchJSON("/production-dates");
        setDates(json.reverse());
        setSelectedDate(json[0]);
      } catch (err) {
        console.error(err);
      }
    };
    fetchDates();
  }, []);

  // Retrieve previous data for FBA or hours
  const fetchPreviousData = async (type) => {
    try {
      const data = await fetchLib.fetchJSON(
        `/historical-range?startDate=${selectedDate}&endDate=${selectedDate}`
      );
      return data[0][type];
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  const handleFBAUpdate = async (e) => {
    e.preventDefault();
    const prevFBA = await fetchPreviousData("FBA");
    const userConfirmed = window.confirm(
      `${prevFBA} FBA items are currently recorded for ${selectedDate}. Overwrite?`
    );
    if (!userConfirmed) return;

    setLoadingFBA(true);
    try {
      const res = await fetch("/FBA", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ FBA, date: selectedDate }),
      });
      const data = await res.json();
      alert(`FBA updated to ${FBA} for ${selectedDate}`);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingFBA(false);
    }
  };

  const handleHoursUpdate = async (e) => {
    e.preventDefault();
    const prevHours = await fetchPreviousData("totalHours");
    const userConfirmed = window.confirm(
      `${prevHours} hours are currently recorded for ${selectedDate}. Overwrite?`
    );
    if (!userConfirmed) return;

    setLoadingHours(true);
    try {
      const res = await fetch("/total-hours", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          totalHours: parseFloat(totalHours),
          date: selectedDate,
        }),
      });
      const data = await res.json();
      alert(`Total hours updated to ${totalHours} for ${selectedDate}`);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHours(false);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    const formData = new FormData();
    formData.append("excelFile", file);

    try {
      const res = await fetch("/load-hours", { method: "PUT", body: formData });
      const data = await res.json();
      alert("Hours from worksheet successfully uploaded.");
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    try {
      const res = await fetch("/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) window.location.href = "/login.html";
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <section className="dates">
        <h1>Select Date</h1>
        <select
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        >
          {dates.map((date) => (
            <option key={date} value={date}>
              {date}
            </option>
          ))}
        </select>
      </section>

      <section className="FBA">
        <form onSubmit={handleFBAUpdate}>
          <Controll
            htmlFor={"FBA"}
            label={"FBA Items"}
            type={"number"}
            onChange={(e) => setFBA(e.target.value)}
          />
          <input type="submit" value="Submit" />
        </form>
        <LoadingMssg bool={loadingFBA} />
      </section>

      <section className="total-hours">
        <form onSubmit={handleHoursUpdate}>
          <Controll
            htmlFor={"totalHours"}
            label={"Total Hours"}
            onChange={(e) => setTotalHours(e.target.value)}
          />

          <input type="submit" value="Submit" />
        </form>
        <LoadingMssg bool={loadingHours} />
      </section>

      <section className="load-hours">
        <h1>Load Hours</h1>
        <form onSubmit={handleFileUpload}>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => setFile(e.target.files[0])}
            required
          />
          <input type="submit" value="Upload Hours" />
        </form>
      </section>

      <button className="logout" onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
};

export default RecordHours;
