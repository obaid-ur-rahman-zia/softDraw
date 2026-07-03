import { useState } from "react";

/**
 * Wraps an async server action, exposing `{ mutate, pending }`.
 * Drop-in replacement for the old Convex-backed hook — call sites keep
 * `const { mutate, pending } = useApiMutation(someServerAction)`.
 */
export const useApiMutation = <TArgs, TResult>(
  action: (args: TArgs) => Promise<TResult>
) => {
  const [pending, setPending] = useState(false);

  const mutate = (payload: TArgs): Promise<TResult> => {
    setPending(true);
    return action(payload).finally(() => setPending(false));
  };

  return { mutate, pending };
};
