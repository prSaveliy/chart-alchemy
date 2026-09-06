// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface FetchResult<T = any> {
  data?: T;
  errorMessage?: string;
  statusCode?: number;
  isAborted?: boolean;
}
