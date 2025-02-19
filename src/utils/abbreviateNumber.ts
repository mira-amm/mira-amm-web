// Convert UsdRate to abbreviated string

const abbreviateNumber = (num: number): string => {
  const units = [
    {value: 1e12, suffix: "T"},
    {value: 1e9, suffix: "B"},
    {value: 1e6, suffix: "M"},
  ];

  for (const {value, suffix} of units) {
    if (num >= value) {
      return (num / value).toFixed(2) + suffix;
    }
  }

  // If the number is in thousands, format with toLocaleString
  if (num >= 1000) {
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  return num.toFixed(2);
};

export default abbreviateNumber;
