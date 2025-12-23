// src/utils/form-library.js

export function getDropdownValue(dropdown) {
  const selectedText = dropdown.options[dropdown.selectedIndex].innerText;
  const index = selectedText.indexOf("|");
  return index !== -1 ? selectedText.slice(0, index).trim() : selectedText.trim();
}
