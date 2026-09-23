import { DATE_TOKENS } from "./constants";
import type { NamingOptions } from "./types";

export function resolveDateTokens(template: string, dateValue: string): string {
  return DATE_TOKENS.reduce(
    (result, token) => result.replaceAll(token, dateValue),
    template,
  );
}

export function usesDateToken(template: string): boolean {
  return DATE_TOKENS.some((token) => template.includes(token));
}

export function buildLocaleFrameName(
  locale: string,
  naming: NamingOptions,
  dateValue: string,
  baseName: string,
): string {
  const suffix = resolveDateTokens(naming.nameSuffix.trim(), dateValue.trim());
  return `${locale}${naming.delimiter ?? ""}${suffix || baseName}`;
}
