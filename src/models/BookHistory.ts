export type BookHistoryEntry = {
  date: string;
  version: string;
  nodeCount?: number;
  nodeIds?: string[];
};

export type BookHistory = {
  name: string;
  history: BookHistoryEntry[];
};
