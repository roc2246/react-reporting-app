function extractOrderData(orders) {
  const allMatches = (data, regex) => data.customerNotes.matchAll(regex);
  return orders.reduce((acc, order) => {
    const orderObj = {
      name: order.billTo.name,
      customerNotes: order.customerNotes,
      orderNumber: +order.customerNotes.match(/\b\d+\b(?!\))/g)?.[0],
      quantity: Array.from(allMatches(order, /\((\d+)\)/g), (m) => +m[1]),
      itemCode: Array.from(allMatches(order, /\(\d+\)([^:]+)/g), (m) => m[1]),
    };
    if (order.customerNotes) acc.push(orderObj);
    return acc;
  }, []);
}

function extractDuplicateData(items) {
  return items.reduce((acc, item) => {
    const itemObj = {
      name: item.name,
      orderNumber: item.orderNumber,
      quantity: item.quantity,
      itemCode: item.itemCode,
    };
    if (item.quantity.some((value) => value > 1)) acc.push(itemObj);
    return acc;
  }, []);
}

module.exports = {
  extractOrderData,
  extractDuplicateData,
};
