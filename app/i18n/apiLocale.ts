import request from "umi-request";
import { DEFAULT_LOCALE, type Locale } from "./config";

// The Wellms API (escolalms/translations) answers in the language of the X-Locale header,
// e.g. validation and error messages. The SDK sends every request through umi-request's
// shared instance, so one interceptor covers all SDK calls.
let currentLocale: Locale = DEFAULT_LOCALE;

export function setApiLocale(locale: Locale) {
  currentLocale = locale;
}

type Options = { headers?: Record<string, string> } & Record<string, unknown>;

export function withLocaleHeader(url: string, options: Options) {
  return { url, options: { ...options, headers: { "X-Locale": currentLocale, ...options.headers } } };
}

let installed = false;

export function installApiLocaleInterceptor() {
  if (installed) return;
  installed = true;
  request.interceptors.request.use((url, options) => withLocaleHeader(url, options as Options));
}
