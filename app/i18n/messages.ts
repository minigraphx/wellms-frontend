import type { Locale } from "./config";
import * as common from "./messages/common";

// One module per area; German is the master, every other language must match its keys.
const namespaces = { common };

type Namespaces = typeof namespaces;
export type Messages = { [N in keyof Namespaces]: Namespaces[N]["de"] };

function forLocale(locale: Locale): Messages {
  return Object.fromEntries(
    Object.entries(namespaces).map(([name, ns]) => [name, ns[locale]])
  ) as Messages;
}

export const messages: Record<Locale, Messages> = { de: forLocale("de"), en: forLocale("en") };
