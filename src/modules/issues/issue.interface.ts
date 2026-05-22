export interface TIssue {
  title: string;
  description: string;
  type: "bug" | "feature_request";
}

export interface TIssueFilters {
  type?: "bug" | "feature_request";
  status?: "open" | "in_progress" | "resolved";
  sort?: "newest" | "oldest";
}


export interface TReporter {
  id: number;
  name: string;
  role: string;
}

export interface TIssueResponse {
  id: number;
  title: string;
  description: string;
  type: string;
  status: string;
  reporter?: TReporter; 
  updated_at: Date;
}