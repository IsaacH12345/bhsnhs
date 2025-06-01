
export interface PageConfig {
  id: string;
  label: string;
  path: string;
}

export interface StatisticItem {
  id: string;
  label: string;
  value: string | number;
}

export interface DateItem {
  id: string;
  date: string;
  event: string;
}
    