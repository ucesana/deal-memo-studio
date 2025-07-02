export interface Spreadsheet {
  id?: string;
  title: string;
  sheets: Sheet[];
}

export interface Sheet {
  title: string;
  data: string[][];
}
