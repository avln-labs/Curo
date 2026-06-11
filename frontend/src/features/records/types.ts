export interface RecordsItem {
  id: string;
  title: string;
  category: string;
  date: string;
  status: string;
}

export interface RecordsResult {
  success: boolean;
  message: string;
  records: RecordsItem[];
  sharedLink: string;
}
