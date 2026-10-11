'use client';

import { createContext, use } from 'react';

/** Field errors from the last submission, keyed by input name. */
export const FormErrorsContext = createContext<Record<string, string>>({});

export function useFieldError(name: string) {
  return use(FormErrorsContext)[name];
}
