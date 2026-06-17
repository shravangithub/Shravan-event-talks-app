export interface ReleaseNote {
  id: string;
  title: string;
  updated: string;
  content: string;
  link: string;
  category: "feature" | "changed" | "fixed" | "deprecated" | "announcement";
}

export interface FeedResponse {
  success: boolean;
  error?: string;
  feedTitle: string;
  feedUpdated: string;
  entries: ReleaseNote[];
}
