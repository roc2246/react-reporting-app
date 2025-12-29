export default function ReportGeneration({ className, generateReport }) {
  return (
    <button onClick={generateReport} className={`${className}__generate`}>
      Generate Report
    </button>
  );
}
