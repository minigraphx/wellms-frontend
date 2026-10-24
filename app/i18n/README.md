# Translations

German is the default language, English the alternative. The choice is stored in the `lang` cookie (`LanguageSwitcher`), so server-rendered pages come out in the right language.

## Using texts

- Client components: `const t = useT();`, then `t.nav.myCourses`, `t.common.lessonCount(n)`.
- Server components and `generateMetadata`: `const t = await getT();` from `app/i18n/server.ts`.
- Dates and numbers: `const { date, number, currency } = useFormat();` (`de-CH` / `en-GB`, time zone Europe/Zurich). Don't call `toLocaleDateString` directly.

## Adding texts

Each area has a namespace in `messages/<area>.ts` with a German `de` object (the master) and `en: Translation<typeof de>`. A key missing in `en`, or an extra key there, is a type error.

- Plain text: `enroll: "Jetzt einschreiben"`.
- With values: a function, `topicsLeft: (n: number) => \`Noch ${n} Lektionen\``. Handle singular and plural inside it.
- Put words used across areas (sign in, save, loading, …) in `common`. Don't repeat them in an area.

## Style

- Address learners informally with "du" (as on the current site), in Swiss spelling: "ss" instead of "ß" (schliessen, Grösse).
- Keep texts short and plain, the way the English ones are.
- Don't translate content that comes from the API (course titles, lesson texts) or prompts sent to the AI.
