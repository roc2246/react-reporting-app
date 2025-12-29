export default function ExcellDownloads({ startDate, endDate }) {
  const handleDownload = async (urlSuffix, filename) => {
    try {
      const response = await fetch(
        `${urlSuffix}?startDate=${startDate}&endDate=${endDate}`
      );
      const blob = await response.blob();

      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = filename;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(link.href);
    } catch (err) {
      console.error("Download error:", err);
    }
  };

  return (
    <>
      <button
        className="download-orders download-orders--orders"
        onClick={() =>
          handleDownload(
            "/api/download-report",
            `Report-${startDate}-to-${endDate}.xlsx`
          )
        }
      >
        Download Orders Timeframe
      </button>

      <button
        className="download-orders download-orders--ids"
        onClick={() =>
          handleDownload(
            "/api/download-ids",
            `Order-IDs-${startDate}-to-${endDate}.xlsx`
          )
        }
      >
        Download Order IDs Timeframe
      </button>
    </>
  );
}
