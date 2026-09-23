const pad2 = (value: number) => String(value).padStart(2, "0");

export const formatCompactDate = (date: Date = new Date()): string =>
  `${date.getFullYear()}${pad2(date.getMonth() + 1)}${pad2(date.getDate())}`;
