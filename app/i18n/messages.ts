import type { Locale } from "./config";
import * as common from "./messages/common";
import * as nav from "./messages/nav";
import * as auth from "./messages/auth";
import * as catalog from "./messages/catalog";
import * as course from "./messages/course";
import * as player from "./messages/player";
import * as learner from "./messages/learner";
import * as shop from "./messages/shop";

// One module per area; German is the master, every other language must match its keys.
const namespaces = { common, nav, auth, catalog, course, player, learner, shop };

type Namespaces = typeof namespaces;
export type Messages = { [N in keyof Namespaces]: Namespaces[N]["de"] };

function forLocale(locale: Locale): Messages {
  return Object.fromEntries(
    Object.entries(namespaces).map(([name, ns]) => [name, ns[locale]])
  ) as Messages;
}

export const messages: Record<Locale, Messages> = { de: forLocale("de"), en: forLocale("en") };
