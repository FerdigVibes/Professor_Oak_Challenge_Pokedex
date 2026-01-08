export function getTimePeriod(hour) {
  if (hour >= 4 && hour < 10) return "morning";
  if (hour >= 10 && hour < 18) return "day";
  return "night";
}
