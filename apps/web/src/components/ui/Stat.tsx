"use client";

import { useCallback } from "react";
import { useCountUp } from "@/animations/micro-interactions/useCountUp";
import { useLocale } from "next-intl";
import { formatNumber } from "@/lib/format";
import type { Locale } from "@/i18n/routing";
import { cn } from "@/lib/cn";

/**
 * A single headline figure. The final value is rendered server-side and only
 * animated on the client, so the number is never wrong in a crawler's snapshot.
 */
export function Stat({
  value,
  label,
  suffix,
  className,
  tone = "default",
  size = "md",
  decimals = 0,
}: {
  value: number;
  label: string;
  suffix?: string;
  className?: string;
  tone?: "default" | "light";
  /** `xl` is the display size used in the numbers band. */
  size?: "md" | "xl";
  /** Digits kept while counting, so 7.4 does not count as 0, 1, … 7. */
  decimals?: number;
}) {
  const locale = useLocale() as Locale;
  const format = useCallback(
    (n: number) => formatNumber(Number(n.toFixed(decimals)), locale),
    [locale, decimals],
  );
  const ref = useCountUp<HTMLSpanElement>(value, format);

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <p
        className={cn(
          "font-display font-bold tabular",
          size === "xl" ? "display-figure" : "text-3xl sm:text-4xl",
          tone === "light" ? "text-ground-50" : "text-heading",
        )}
      >
        {/* One left-to-right run: digits then unit, in every script. */}
        <bdi dir="ltr">
          <span ref={ref}>{formatNumber(value, locale)}</span>
          {suffix ? (
            <span
              className={cn(
                "ms-1",
                size === "xl"
                  ? "text-lg tracking-normal sm:text-xl"
                  : "text-xl",
                tone === "light" ? "text-aqua-300" : "text-aqua-500",
              )}
            >
              {suffix}
            </span>
          ) : null}
        </bdi>
      </p>
      <p
        className={cn(
          "text-sm",
          tone === "light" ? "text-ink-300" : "text-ink-500",
        )}
      >
        {label}
      </p>
    </div>
  );
}
