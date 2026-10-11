/** What every admin Server Action returns to its form. */
export type FormState = {
  ok?: boolean;
  /** One sentence for the top of the form. */
  error?: string;
  /** Shown in green after a successful save. */
  message?: string;
  /** Per-field messages, keyed by input name. */
  fieldErrors?: Record<string, string>;
  /** One-time values the form must show, such as a generated password. */
  reveal?: { label: string; values: string[] };
};

export const initialFormState: FormState = {};
