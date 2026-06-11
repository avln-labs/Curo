export interface HealthThreadItem {
  id: string;
  title: string;
  date: string;
  description: string;
  category: string;
}

export interface HealthThreadResult {
  success: boolean;
  message: string;
  threads: HealthThreadItem[];
}
