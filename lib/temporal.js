function getTemporalMatch(data, year, filterKey = null, filterValue = null) {
  if (!Array.isArray(data)) {
    throw new Error('data must be an array');
  }

  const subset = filterKey
    ? data.filter((r) => String(r[filterKey]) === String(filterValue))
    : data;

  if (!subset.length) {
    return null;
  }

  let best = null;
  for (const row of subset) {
    const rowYear = parseInt(row.Year);
    if (isNaN(rowYear)) {
      continue;
    }

    if (rowYear <= year) {
      best = row;
    } else {
      break;
    }
  }

  return best;
}

function getExactMatch(data, year, filterKey = null, filterValue = null) {
  if (!Array.isArray(data)) {
    throw new Error('data must be an array');
  }

  const subset = filterKey
    ? data.filter((r) => String(r[filterKey]) === String(filterValue))
    : data;

  return subset.find((r) => parseInt(r.Year) === year) || null;
}

module.exports = {
  getTemporalMatch,
  getExactMatch,
};
