export default function ExcellDownloads({ date }) {
  const handleDownload = async (urlSuffix, filename) => {
    try {
      const response = await fetch(
        `${urlSuffix}?startDate=${date}&endDate=${date}`
      );
      const blob = await response.blob();
      const url = window.URL.createObjectURL(new Blob([blob]));
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error:", err);
    }
  };

  return (
    <>
      <button
        className="download-orders download-orders--orders"
        onClick={() =>
          handleDownload("/api/download-report", `Report - ${date}.xlsx`)
        }
      >
        Download Orders for this timeframe
      </button>
      <button
        className="download-orders download-orders--ids"
        onClick={() =>
          handleDownload("/api/download-ids", `Order IDs - ${date}.xlsx`)
        }
      >
        Download Order IDs for this timeframe
      </button>
    </>
  );
}
