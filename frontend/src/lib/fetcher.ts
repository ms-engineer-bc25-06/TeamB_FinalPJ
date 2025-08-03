export const fetcher = async <T>(
  ...args: [RequestInfo, RequestInit?]
): Promise<T> => {
  const res = await fetch(...args);

  if (!res.ok) {
    const errorInfo = await res.text();
    const error = new Error(
      `APIからのデータ取得中にエラーが発生しました😭: ${errorInfo}`,
    );
    throw error;
  }

  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return res.json();
  }
  return res.text() as unknown as T;
};
