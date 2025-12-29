export default function ReportGeneration({ className, handleGenerateReport }) {
  return (
    <button onClick={handleGenerateReport} className={`${className}__generate`}>
      Generate Report
    </button>
  );
}
