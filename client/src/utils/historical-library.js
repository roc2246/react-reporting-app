// src/utils/historical-library.js

export function createRow(name, count) {
  const row = document.createElement("span");
  row.classList.add("historical-summary__row");

  const productName = document.createElement("h4");
  productName.classList.add("historical-summary__product-name");
  productName.innerText = name;
  row.append(productName);

  const productCount = document.createElement("p");
  productCount.classList.add("historical-summary__product-count");
  productCount.innerText = count;
  row.append(productCount);

  return row;
}
