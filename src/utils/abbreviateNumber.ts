// Convert UsdRate to abbreviated string

const abbreviateNumber = (num: number): string => {
  const units = [
    {value: 1e12, suffix: "T"},
    {value: 1e9, suffix: "B"},
    {value: 1e6, suffix: "M"},
  ];

  const formatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  for (const {value, suffix} of units) {
    if (num >= value) {
      return formatter.format(num / value) + suffix;
    }
  }

  // If the number is in thousands, format with Intl.NumberFormat
  if (num >= 1000) {
    return formatter.format(num);
  }

  // For numbers below 1,000, use locale formatting
  return formatter.format(num);
};

export default abbreviateNumber;
