export const sortByOrder = <T extends { order: number }>(items: readonly T[]): T[] => {
  return [...items].sort((a, b) => a.order - b.order);
};

export const sortByDate = <T extends { date: string }>(items: readonly T[]): T[] => {
  return [...items].sort((a, b) => a.date.localeCompare(b.date));
};
