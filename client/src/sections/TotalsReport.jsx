export default function TotalsReport({ data}) {
  return (
    <section className="historical-summary">
        <div className="historical-summary__data">
          {data.map(([name, count]) => (
            <div className="historical-summary__row" key={name}>
              <h4 className="historical-summary__product-name">{name}</h4>
              <p className={`historical-summary__product-count--${name}`}>
                {count}
              </p>
            </div>
          ))}
        </div>
      </section>
  )}