export default function Input({className, value}) {
  return (
    <input
      type="submit"
      className={`btn ${className}__btn `}
      value={value}
    />
  );
}
