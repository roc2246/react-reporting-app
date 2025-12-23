// src/utils/table-library.js

export function createCell(element, className) {
  const cell = document.createElement(element);
  cell.classList.add(className);
  return cell;
}

export function createTableRow(catName, data, classPrefix) {
  const row = createCell("tr", `${classPrefix}__table-category`);
  const rowName = createCell("th", `${classPrefix}__table-category-name`);
  rowName.innerText = catName;
  row.append(rowName);

  data.forEach(item => {
    const rowValue = createCell("td", `${classPrefix}__table-category-value`);
    rowValue.innerText = item[catName];
    row.append(rowValue);
  });

  return row;
}
