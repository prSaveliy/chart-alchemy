import { unauthorizedInterceptor } from "@/lib/interceptors";

export const handleUnauthorized = async (
  retriedRef: React.RefObject<boolean>,
  navigate: (path: string) => void,
  cb: () => Promise<void>,
) => {
  const interceptorResult = await unauthorizedInterceptor();
  if (interceptorResult && interceptorResult.statusCode === 401) {
    navigate("/login");
    return;
  }
  retriedRef.current = true;
  await cb();
  retriedRef.current = false;
};
