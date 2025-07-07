export interface ResponseInfoType<T> {
  response_status: ResponseStatus;
  data: T;
}

export interface ResponseStatus {
  code: number;
  extension: {
    key: string;
    value: string;
  };
  msg: string;
}

export interface PageInfo {
  total_count: number;
  total_page: number;
}

export interface Pagination {
  page: number;
  limit: number;
}