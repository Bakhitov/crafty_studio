# v1.3.9 (Unreleased)

#### ✨ Маркетинг / Лендинг

- Обновлён оффер и тексты геро-секции на русском (более продающий) (`app/(unauthenticated)/home/components/hero.tsx`)
- Переведены и переписаны секции Features/Providers на русский (`app/(unauthenticated)/home/components/features/index.tsx`, `app/(unauthenticated)/home/components/providers.tsx`)
- Добавлен блок тарифов на главную, переиспользован `pricing/components/hero` (`app/(unauthenticated)/home/page.tsx`)
- Локализован футер CTA на русский (`app/(unauthenticated)/components/footer.tsx`)
- Удалены внешние ссылки и упоминания опенсорса из субфутера, локализованы пункты меню (`app/(unauthenticated)/components/sub-footer.tsx`)
- Обновлены метаданные главной и индексной страниц (title/description) (`app/(unauthenticated)/home/page.tsx`, `app/page.tsx`)
- Добавлены два новых демо-шаблона изображений и подключены в Features:
  - Создан `app/(unauthenticated)/home/components/features/image-from-photo-demo.tsx`
  - Создан `app/(unauthenticated)/home/components/features/image-combine-demo.tsx`
  - Обновлён `app/(unauthenticated)/home/components/features/index.tsx` — замена двух повторов `ImageDemo` на новые демо

#### 🐛 Auth

- Улучшена обработка подтверждения email: корректная обработка ошибок `error`/`error_description` и устранение ложного сообщения «No token hash or type» при истёкших/невалидных ссылках (`app/auth/confirm/route.ts`).
 - Скрыт соц-логин (GitHub/Twitter) на страницах входа/регистрации, оставлена только почта/пароль (`app/auth/login/page.tsx`, `app/auth/sign-up/page.tsx`).
 - Удалён Cloudflare Turnstile из форм, а также переменная `NEXT_PUBLIC_TURNSTILE_SITE_KEY` и server-side `TURNSTILE_SECRET` из `env.example`; обновлена схема env (`lib/env.ts`), формы (`app/auth/*/components/*-form.tsx`).

#### 🖼️ Изображения

- Seedream: отключён водяной знак на уровне запроса к Ark для всех Seedream-моделей (`lib/models/image/ark.ts`).
- По умолчанию используется Seedream 4.0 для генерации изображений (`lib/models/image/index.ts`).
- Во всех демо-узлах изображений явно задана модель `seedream-4-0-250828` (`app/(unauthenticated)/home/components/features/image-demo.tsx`, `image-from-photo-demo.tsx`, `image-combine-demo.tsx`).
- I2I: добавлено объединение Prompt (из текстовых нод) + Instructions при редактировании изображений, чтобы вместе с входными картинками учитывался и текстовый контекст (`components/nodes/image/transform.tsx`).

#### 🧭 Навигация / Меню

- Починен баг: модалка профиля больше не закрывается сразу после открытия из дропдауна (`components/menu.tsx`).
- Кнопка «Отправить отзыв» теперь открывает Telegram по диплинку на номер `+77066318623` (`components/menu.tsx`).

#### 📂 Галерея

- Карточки в гриде больше не растягиваются по высоте экрана, выравнивание по началу строки (`components/toolbar.tsx`).
- Удалены дублирующиеся нижние экшены в карточке файла, оставлены оверлейные кнопки (`components/toolbar.tsx`).

#### 🧩 API

- Добавлен endpoint биллинга админки (`app/api/admin/billing/route.ts`).
- Добавлен endpoint `v1/credits/claim` (`app/api/v1/credits/claim/route.ts`).
- Добавлен экшен листинга изображений (`app/actions/image/list-files.ts`).

#### 🔐 Безопасность

- Санитизирован `.env.example`: заменены реальные ключи и секреты на шаблонные значения.

#### 🗑️ Удалено

- Удалены ассеты: `app/apple-icon.png`, `app/icon.png`, `app/opengraph-image.png`.

---

# v1.3.8 (Wed Aug 20 2025)

#### 🐛 Bug Fix

- Gateway [#124](https://github.com/haydenbleasel/crafty/pull/124) ([@haydenbleasel](https://github.com/haydenbleasel))

#### ✨ UI Updates

- Remove plus indicator from node right handle (`components/nodes/layout.tsx`)
- Update DropNode right visual (black circle with bold plus) (`components/nodes/drop.tsx`)
- Fix image preview modal close behavior (`components/nodes/image/transform.tsx`)
- Add vertical separator before gallery button in bottom toolbar (`components/toolbar.tsx`)
- Increase gallery separator contrast and thickness (`components/toolbar.tsx`)
- Make gallery downloads use programmatic download util (`components/toolbar.tsx`)
- Remove plus indicator on node right handle (`components/nodes/layout.tsx`)
- Show drop-node selector only on double-clicking pane, not nodes (`components/canvas.tsx`)
- Rename Text node label to Prompt (`lib/node-buttons.ts`, `components/nodes/text/index.tsx`)

#### 🎨 UI

- Remove plus indicator from node right handle (components/nodes/layout.tsx)
- Style right-side DropNode as black circle with bold plus (components/nodes/drop.tsx)

#### Authors: 1

- Hayden Bleasel ([@haydenbleasel](https://github.com/haydenbleasel))

---

# v1.3.7 (Sat Jul 26 2025)

#### 🐛 Bug Fix

- Bump form-data from 4.0.2 to 4.0.4 in the npm_and_yarn group [#112](https://github.com/haydenbleasel/crafty/pull/112) ([@dependabot[bot]](https://github.com/dependabot[bot]))

#### Authors: 1

- [@dependabot[bot]](https://github.com/dependabot[bot])

---

# v1.3.6 (Tue Jul 01 2025)

#### 🐛 Bug Fix

- Bump @types/node from 24.0.1 to 24.0.8 [#102](https://github.com/haydenbleasel/crafty/pull/102) ([@dependabot[bot]](https://github.com/dependabot[bot]))
- Bump @types/react-dom from 19.1.5 to 19.1.6 [#106](https://github.com/haydenbleasel/crafty/pull/106) ([@dependabot[bot]](https://github.com/dependabot[bot]))
- Bump tailwindcss from 4.1.8 to 4.1.11 [#108](https://github.com/haydenbleasel/crafty/pull/108) ([@dependabot[bot]](https://github.com/dependabot[bot]))

#### 🔩 Dependency Updates

- Bump concurrently from 9.1.2 to 9.2.0 [#104](https://github.com/haydenbleasel/crafty/pull/104) ([@dependabot[bot]](https://github.com/dependabot[bot]))

#### Authors: 1

- [@dependabot[bot]](https://github.com/dependabot[bot])

---

# v1.3.5 (Sun Jun 22 2025)

#### ⚠️ Pushed to `main`

- Resolves #98 ([@haydenbleasel](https://github.com/haydenbleasel))

#### Authors: 1

- Hayden Bleasel ([@haydenbleasel](https://github.com/haydenbleasel))

---

# v1.3.4 (Sun Jun 15 2025)

#### ⚠️ Pushed to `main`

- Resolves #63 ([@haydenbleasel](https://github.com/haydenbleasel))

#### Authors: 1

- Hayden Bleasel ([@haydenbleasel](https://github.com/haydenbleasel))

---

# v1.3.3 (Sun Jun 15 2025)

#### 🐛 Bug Fix

- Perplexity [#97](https://github.com/haydenbleasel/crafty/pull/97) ([@haydenbleasel](https://github.com/haydenbleasel))

#### Authors: 1

- Hayden Bleasel ([@haydenbleasel](https://github.com/haydenbleasel))

---

# v1.3.2 (Sun Jun 15 2025)

#### ⚠️ Pushed to `main`

- Bump deps ([@haydenbleasel](https://github.com/haydenbleasel))

#### Authors: 1

- Hayden Bleasel ([@haydenbleasel](https://github.com/haydenbleasel))

---

# v1.3.1 (Sat Jun 14 2025)

#### 🐛 Bug Fix

- Bump brace-expansion from 2.0.1 to 2.0.2 in the npm_and_yarn group [#96](https://github.com/haydenbleasel/crafty/pull/96) ([@dependabot[bot]](https://github.com/dependabot[bot]))

#### Authors: 1

- [@dependabot[bot]](https://github.com/dependabot[bot])

---

# v1.3.0 (Sat Jun 14 2025)

#### 🚀 Enhancement

- Chef-model [#95](https://github.com/haydenbleasel/crafty/pull/95) ([@haydenbleasel](https://github.com/haydenbleasel))

#### Authors: 1

- Hayden Bleasel ([@haydenbleasel](https://github.com/haydenbleasel))

---

# v1.2.14 (Sat Jun 07 2025)

#### ⚠️ Pushed to `main`

- Update package.json ([@haydenbleasel](https://github.com/haydenbleasel))
- Update shadcn/ui ([@haydenbleasel](https://github.com/haydenbleasel))
- Bump deps ([@haydenbleasel](https://github.com/haydenbleasel))

#### Authors: 1

- Hayden Bleasel ([@haydenbleasel](https://github.com/haydenbleasel))

---

# v1.2.13 (Fri Jun 06 2025)

#### ⚠️ Pushed to `main`

- Update welcome-demo.tsx ([@haydenbleasel](https://github.com/haydenbleasel))

#### Authors: 1

- Hayden Bleasel ([@haydenbleasel](https://github.com/haydenbleasel))

---

# v1.2.12 (Sun Jun 01 2025)

#### ⚠️ Pushed to `main`

- Use avatar for menu icon ([@haydenbleasel](https://github.com/haydenbleasel))

#### Authors: 1

- Hayden Bleasel ([@haydenbleasel](https://github.com/haydenbleasel))

---

# v1.2.11 (Sun Jun 01 2025)

#### ⚠️ Pushed to `main`

- Bump remaining deps ([@haydenbleasel](https://github.com/haydenbleasel))

#### 🔩 Dependency Updates

- Bump openai from 4.103.0 to 5.0.1 [#86](https://github.com/haydenbleasel/crafty/pull/86) ([@dependabot[bot]](https://github.com/dependabot[bot]))
- Bump drizzle-orm from 0.43.1 to 0.44.1 [#89](https://github.com/haydenbleasel/crafty/pull/89) ([@dependabot[bot]](https://github.com/dependabot[bot]))
- Bump @icons-pack/react-simple-icons from 12.8.0 to 13.0.0 [#94](https://github.com/haydenbleasel/crafty/pull/94) ([@dependabot[bot]](https://github.com/dependabot[bot]))
- Bump next from 15.3.2 to 15.3.3 [#83](https://github.com/haydenbleasel/crafty/pull/83) ([@dependabot[bot]](https://github.com/dependabot[bot]))
- Bump lumaai from 1.9.0 to 1.11.0 [#90](https://github.com/haydenbleasel/crafty/pull/90) ([@dependabot[bot]](https://github.com/dependabot[bot]))

#### Authors: 2

- [@dependabot[bot]](https://github.com/dependabot[bot])
- Hayden Bleasel ([@haydenbleasel](https://github.com/haydenbleasel))

---

# v1.2.10 (Sun Jun 01 2025)

#### ⚠️ Pushed to `main`

- Update dependabot.yml ([@haydenbleasel](https://github.com/haydenbleasel))

#### Authors: 1

- Hayden Bleasel ([@haydenbleasel](https://github.com/haydenbleasel))

---

# v1.2.9 (Sun Jun 01 2025)

#### ⚠️ Pushed to `main`

- Update Stripe ([@haydenbleasel](https://github.com/haydenbleasel))

#### Authors: 1

- Hayden Bleasel ([@haydenbleasel](https://github.com/haydenbleasel))

---

# v1.2.8 (Sun Jun 01 2025)

#### ⚠️ Pushed to `main`

- Update demo.ts ([@haydenbleasel](https://github.com/haydenbleasel))
- Update text-demo.tsx ([@haydenbleasel](https://github.com/haydenbleasel))
- Use connections instead of node sources ([@haydenbleasel](https://github.com/haydenbleasel))
- Update layout.tsx ([@haydenbleasel](https://github.com/haydenbleasel))
- Fix feedback link ([@haydenbleasel](https://github.com/haydenbleasel))
- Fix line consistency ([@haydenbleasel](https://github.com/haydenbleasel))
- Memoize project selector components ([@haydenbleasel](https://github.com/haydenbleasel))

#### Authors: 1

- Hayden Bleasel ([@haydenbleasel](https://github.com/haydenbleasel))

---

# v1.2.7 (Sun Jun 01 2025)

#### ⚠️ Pushed to `main`

- Fix typo ([@haydenbleasel](https://github.com/haydenbleasel))
- Misc cleanup ([@haydenbleasel](https://github.com/haydenbleasel))
- Move credits counter to client ([@haydenbleasel](https://github.com/haydenbleasel))
- Fix Toaster ([@haydenbleasel](https://github.com/haydenbleasel))

#### Authors: 1

- Hayden Bleasel ([@haydenbleasel](https://github.com/haydenbleasel))

---

# v1.2.6 (Sun Jun 01 2025)

#### ⚠️ Pushed to `main`

- Switch to Drizzle query ([@haydenbleasel](https://github.com/haydenbleasel))

#### Authors: 1

- Hayden Bleasel ([@haydenbleasel](https://github.com/haydenbleasel))

---

# v1.2.5 (Sun Jun 01 2025)

#### ⚠️ Pushed to `main`

- Fix typo ([@haydenbleasel](https://github.com/haydenbleasel))

#### Authors: 1

- Hayden Bleasel ([@haydenbleasel](https://github.com/haydenbleasel))

---

# v1.2.4 (Sun Jun 01 2025)

#### ⚠️ Pushed to `main`

- Fix "add new node" context menu item ([@haydenbleasel](https://github.com/haydenbleasel))

#### Authors: 1

- Hayden Bleasel ([@haydenbleasel](https://github.com/haydenbleasel))

---

# v1.2.3 (Sun Jun 01 2025)

#### ⚠️ Pushed to `main`

- Automatically switch between primitive and transform ([@haydenbleasel](https://github.com/haydenbleasel))
- Resolves #80 ([@haydenbleasel](https://github.com/haydenbleasel))

#### Authors: 1

- Hayden Bleasel ([@haydenbleasel](https://github.com/haydenbleasel))

---

# v1.2.2 (Sun Jun 01 2025)

#### ⚠️ Pushed to `main`

- Update providers.tsx ([@haydenbleasel](https://github.com/haydenbleasel))

#### Authors: 1

- Hayden Bleasel ([@haydenbleasel](https://github.com/haydenbleasel))

---

# v1.2.1 (Sun Jun 01 2025)

#### ⚠️ Pushed to `main`

- Resolves #76 ([@haydenbleasel](https://github.com/haydenbleasel))
- Improve code editor loading state ([@haydenbleasel](https://github.com/haydenbleasel))
- Rework code to use streamText ([@haydenbleasel](https://github.com/haydenbleasel))
- Memoize toolbar ([@haydenbleasel](https://github.com/haydenbleasel))

#### Authors: 1

- Hayden Bleasel ([@haydenbleasel](https://github.com/haydenbleasel))

---

# v1.2.0 (Sun Jun 01 2025)

#### 🚀 Enhancement

- Replicate [#81](https://github.com/haydenbleasel/crafty/pull/81) ([@haydenbleasel](https://github.com/haydenbleasel))

#### Authors: 1

- Hayden Bleasel ([@haydenbleasel](https://github.com/haydenbleasel))

---

# v1.1.7 (Fri May 30 2025)

#### ⚠️ Pushed to `main`

- Update index.ts ([@haydenbleasel](https://github.com/haydenbleasel))

#### Authors: 1

- Hayden Bleasel ([@haydenbleasel](https://github.com/haydenbleasel))

---

# v1.1.6 (Fri May 30 2025)

#### 🐛 Bug Fix

- Add Black Forest Labs Flux models [#79](https://github.com/haydenbleasel/crafty/pull/79) ([@haydenbleasel](https://github.com/haydenbleasel))

#### Authors: 1

- Hayden Bleasel ([@haydenbleasel](https://github.com/haydenbleasel))

---

# v1.1.5 (Thu May 29 2025)

#### ⚠️ Pushed to `main`

- Fix multiple project providers and redirect ([@haydenbleasel](https://github.com/haydenbleasel))

#### Authors: 1

- Hayden Bleasel ([@haydenbleasel](https://github.com/haydenbleasel))

---

# v1.1.4 (Thu May 29 2025)

#### ⚠️ Pushed to `main`

- Misc fixes ([@haydenbleasel](https://github.com/haydenbleasel))

#### Authors: 1

- Hayden Bleasel ([@haydenbleasel](https://github.com/haydenbleasel))

---

# v1.1.3 (Thu May 29 2025)

#### ⚠️ Pushed to `main`

- Improve routing ([@haydenbleasel](https://github.com/haydenbleasel))

#### Authors: 1

- Hayden Bleasel ([@haydenbleasel](https://github.com/haydenbleasel))

---

# v1.1.2 (Thu May 29 2025)

#### ⚠️ Pushed to `main`

- Update welcome-demo.tsx ([@haydenbleasel](https://github.com/haydenbleasel))

#### Authors: 1

- Hayden Bleasel ([@haydenbleasel](https://github.com/haydenbleasel))

---

# v1.1.1 (Thu May 29 2025)

#### ⚠️ Pushed to `main`

- Update welcome-demo.tsx ([@haydenbleasel](https://github.com/haydenbleasel))

#### Authors: 1

- Hayden Bleasel ([@haydenbleasel](https://github.com/haydenbleasel))

---

# v1.1.0 (Thu May 29 2025)

#### 🚀 Enhancement

- Onboarding [#78](https://github.com/haydenbleasel/crafty/pull/78) ([@haydenbleasel](https://github.com/haydenbleasel))

#### Authors: 1

- Hayden Bleasel ([@haydenbleasel](https://github.com/haydenbleasel))

---

# v1.0.39 (Wed May 28 2025)

#### 🐛 Bug Fix

- Reasoning [#77](https://github.com/haydenbleasel/crafty/pull/77) ([@haydenbleasel](https://github.com/haydenbleasel))

#### Authors: 1

- Hayden Bleasel ([@haydenbleasel](https://github.com/haydenbleasel))

---

# v1.0.38 (Tue May 27 2025)

#### ⚠️ Pushed to `main`

- Update icons ([@haydenbleasel](https://github.com/haydenbleasel))

#### Authors: 1

- Hayden Bleasel ([@haydenbleasel](https://github.com/haydenbleasel))

---

# v1.0.37 (Tue May 27 2025)

#### ⚠️ Pushed to `main`

- Extract think reasoning from groq deepseek ([@haydenbleasel](https://github.com/haydenbleasel))

#### Authors: 1

- Hayden Bleasel ([@haydenbleasel](https://github.com/haydenbleasel))

---

# v1.0.36 (Tue May 27 2025)

#### ⚠️ Pushed to `main`

- Revert "Improve model key detection" ([@haydenbleasel](https://github.com/haydenbleasel))

#### Authors: 1

- Hayden Bleasel ([@haydenbleasel](https://github.com/haydenbleasel))

---

# v1.0.35 (Tue May 27 2025)

#### ⚠️ Pushed to `main`

- Improve model key detection ([@haydenbleasel](https://github.com/haydenbleasel))

#### Authors: 1

- Hayden Bleasel ([@haydenbleasel](https://github.com/haydenbleasel))

---

# v1.0.34 (Tue May 27 2025)

#### ⚠️ Pushed to `main`

- Update deepseek labels ([@haydenbleasel](https://github.com/haydenbleasel))

#### Authors: 1

- Hayden Bleasel ([@haydenbleasel](https://github.com/haydenbleasel))

---

# v1.0.33 (Tue May 27 2025)

#### ⚠️ Pushed to `main`

- Update env.ts ([@haydenbleasel](https://github.com/haydenbleasel))

#### Authors: 1

- Hayden Bleasel ([@haydenbleasel](https://github.com/haydenbleasel))

---

# v1.0.32 (Tue May 27 2025)

#### ⚠️ Pushed to `main`

- Fix cursor move-end bug ([@haydenbleasel](https://github.com/haydenbleasel))

#### Authors: 1

- Hayden Bleasel ([@haydenbleasel](https://github.com/haydenbleasel))

---

# v1.0.31 (Tue May 27 2025)

#### ⚠️ Pushed to `main`

- Add Cohere models ([@haydenbleasel](https://github.com/haydenbleasel))
- Fix typos ([@haydenbleasel](https://github.com/haydenbleasel))

#### Authors: 1

- Hayden Bleasel ([@haydenbleasel](https://github.com/haydenbleasel))

---

# v1.0.30 (Tue May 27 2025)

#### ⚠️ Pushed to `main`

- Allow Pro customers to change vision and transcription models ([@haydenbleasel](https://github.com/haydenbleasel))
- Improve env var linting ([@haydenbleasel](https://github.com/haydenbleasel))
- Skip CI builds ([@haydenbleasel](https://github.com/haydenbleasel))

#### Authors: 1

- Hayden Bleasel ([@haydenbleasel](https://github.com/haydenbleasel))

---

# v1.0.29 (Sun May 25 2025)

#### ⚠️ Pushed to `main`

- Cleanup env vars ([@haydenbleasel](https://github.com/haydenbleasel))
- Bump deps ([@haydenbleasel](https://github.com/haydenbleasel))
- Add bump-ui script ([@haydenbleasel](https://github.com/haydenbleasel))
- Add bump deps script ([@haydenbleasel](https://github.com/haydenbleasel))
- Enable captcha on development ([@haydenbleasel](https://github.com/haydenbleasel))

#### Authors: 1

- Hayden Bleasel ([@haydenbleasel](https://github.com/haydenbleasel))

---

# v1.0.28 (Fri May 23 2025)

#### ⚠️ Pushed to `main`

- Fix auth buttons ([@haydenbleasel](https://github.com/haydenbleasel))

#### Authors: 1

- Hayden Bleasel ([@haydenbleasel](https://github.com/haydenbleasel))

---

# v1.0.27 (Thu May 22 2025)

#### ⚠️ Pushed to `main`

- Forgot to commit the Claude 4 models lol ([@haydenbleasel](https://github.com/haydenbleasel))

#### Authors: 1

- Hayden Bleasel ([@haydenbleasel](https://github.com/haydenbleasel))

---

# v1.0.26 (Thu May 22 2025)

#### ⚠️ Pushed to `main`

- Merge branch 'main' of https://github.com/haydenbleasel/crafty ([@haydenbleasel](https://github.com/haydenbleasel))
- Add support for Claude 4 ([@haydenbleasel](https://github.com/haydenbleasel))
- Misc fixes ([@haydenbleasel](https://github.com/haydenbleasel))

#### Authors: 1

- Hayden Bleasel ([@haydenbleasel](https://github.com/haydenbleasel))

---

# v1.0.25 (Tue May 20 2025)

#### ⚠️ Pushed to `main`

- Misc fixes ([@haydenbleasel](https://github.com/haydenbleasel))

#### Authors: 1

- Hayden Bleasel ([@haydenbleasel](https://github.com/haydenbleasel))

---

# v1.0.24 (Tue May 20 2025)

#### ⚠️ Pushed to `main`

- Add Tweet node ([@haydenbleasel](https://github.com/haydenbleasel))
- Fix debugging styles ([@haydenbleasel](https://github.com/haydenbleasel))
- Improve chat prompts ([@haydenbleasel](https://github.com/haydenbleasel))
- Disable posthog on local ([@haydenbleasel](https://github.com/haydenbleasel))
- Combine node buttons ([@haydenbleasel](https://github.com/haydenbleasel))

#### Authors: 1

- Hayden Bleasel ([@haydenbleasel](https://github.com/haydenbleasel))

---

# v1.0.23 (Sat May 17 2025)

#### ⚠️ Pushed to `main`

- Add support for image sizes ([@haydenbleasel](https://github.com/haydenbleasel))

#### Authors: 1

- Hayden Bleasel ([@haydenbleasel](https://github.com/haydenbleasel))

---

# v1.0.22 (Fri May 16 2025)

#### ⚠️ Pushed to `main`

- For #61 ([@haydenbleasel](https://github.com/haydenbleasel))

#### Authors: 1

- Hayden Bleasel ([@haydenbleasel](https://github.com/haydenbleasel))

---

# v1.0.21 (Fri May 16 2025)

#### ⚠️ Pushed to `main`

- 🤷 ([@haydenbleasel](https://github.com/haydenbleasel))

#### Authors: 1

- Hayden Bleasel ([@haydenbleasel](https://github.com/haydenbleasel))

---

# v1.0.20 (Fri May 16 2025)

#### ⚠️ Pushed to `main`

- Create model_request.md ([@haydenbleasel](https://github.com/haydenbleasel))

#### Authors: 1

- Hayden Bleasel ([@haydenbleasel](https://github.com/haydenbleasel))

---

# v1.0.19 (Fri May 16 2025)

#### ⚠️ Pushed to `main`

- Send feedback to GitHub ([@haydenbleasel](https://github.com/haydenbleasel))

#### Authors: 1

- Hayden Bleasel ([@haydenbleasel](https://github.com/haydenbleasel))

---

# v1.0.18 (Thu May 15 2025)

#### ⚠️ Pushed to `main`

- Update page.tsx ([@haydenbleasel](https://github.com/haydenbleasel))

#### Authors: 1

- Hayden Bleasel ([@haydenbleasel](https://github.com/haydenbleasel))

---

# v1.0.17 (Thu May 15 2025)

#### ⚠️ Pushed to `main`

- Remove remnants ([@haydenbleasel](https://github.com/haydenbleasel))

#### Authors: 1

- Hayden Bleasel ([@haydenbleasel](https://github.com/haydenbleasel))

---

# v1.0.16 (Thu May 15 2025)

:tada: This release contains work from a new contributor! :tada:

Thank you, Karel Vuong ([@karelvuong](https://github.com/karelvuong)), for all your work!

#### 🐛 Bug Fix

- fix: kibo link in readme [#53](https://github.com/haydenbleasel/crafty/pull/53) ([@karelvuong](https://github.com/karelvuong))

#### Authors: 1

- Karel Vuong ([@karelvuong](https://github.com/karelvuong))

---

# v1.0.15 (Thu May 15 2025)

#### ⚠️ Pushed to `main`

- Update transform.tsx ([@haydenbleasel](https://github.com/haydenbleasel))

#### Authors: 1

- Hayden Bleasel ([@haydenbleasel](https://github.com/haydenbleasel))

---

# v1.0.14 (Thu May 15 2025)

#### ⚠️ Pushed to `main`

- Update transform.tsx ([@haydenbleasel](https://github.com/haydenbleasel))

#### Authors: 1

- Hayden Bleasel ([@haydenbleasel](https://github.com/haydenbleasel))

---

# v1.0.13 (Thu May 15 2025)

#### ⚠️ Pushed to `main`

- Misc fixes ([@haydenbleasel](https://github.com/haydenbleasel))

#### Authors: 1

- Hayden Bleasel ([@haydenbleasel](https://github.com/haydenbleasel))

---

# v1.0.12 (Thu May 15 2025)

#### ⚠️ Pushed to `main`

- Increase hobby credits ([@haydenbleasel](https://github.com/haydenbleasel))
- Fix edit image prompt ([@haydenbleasel](https://github.com/haydenbleasel))

#### Authors: 1

- Hayden Bleasel ([@haydenbleasel](https://github.com/haydenbleasel))

---

# v1.0.11 (Thu May 15 2025)

#### ⚠️ Pushed to `main`

- Update hero.tsx ([@haydenbleasel](https://github.com/haydenbleasel))

#### Authors: 1

- Hayden Bleasel ([@haydenbleasel](https://github.com/haydenbleasel))

---

# v1.0.10 (Thu May 15 2025)

#### ⚠️ Pushed to `main`

- Update env.ts ([@haydenbleasel](https://github.com/haydenbleasel))

#### Authors: 1

- Hayden Bleasel ([@haydenbleasel](https://github.com/haydenbleasel))

---

# v1.0.9 (Thu May 15 2025)

#### ⚠️ Pushed to `main`

- Misc fixes ([@haydenbleasel](https://github.com/haydenbleasel))

#### Authors: 1

- Hayden Bleasel ([@haydenbleasel](https://github.com/haydenbleasel))

---

# v1.0.8 (Thu May 15 2025)

#### ⚠️ Pushed to `main`

- Update hero.tsx ([@haydenbleasel](https://github.com/haydenbleasel))

#### Authors: 1

- Hayden Bleasel ([@haydenbleasel](https://github.com/haydenbleasel))

---

# v1.0.7 (Thu May 15 2025)

#### ⚠️ Pushed to `main`

- Fix pricing page links ([@haydenbleasel](https://github.com/haydenbleasel))

#### Authors: 1

- Hayden Bleasel ([@haydenbleasel](https://github.com/haydenbleasel))

---

# v1.0.6 (Thu May 15 2025)

#### ⚠️ Pushed to `main`

- Update sign-up-form.tsx ([@haydenbleasel](https://github.com/haydenbleasel))

#### Authors: 1

- Hayden Bleasel ([@haydenbleasel](https://github.com/haydenbleasel))

---

# v1.0.5 (Thu May 15 2025)

#### ⚠️ Pushed to `main`

- Update route.tsx ([@haydenbleasel](https://github.com/haydenbleasel))

#### Authors: 1

- Hayden Bleasel ([@haydenbleasel](https://github.com/haydenbleasel))

---

# v1.0.4 (Thu May 15 2025)

#### ⚠️ Pushed to `main`

- Update sign-up-form.tsx ([@haydenbleasel](https://github.com/haydenbleasel))

#### Authors: 1

- Hayden Bleasel ([@haydenbleasel](https://github.com/haydenbleasel))

---

# v1.0.3 (Thu May 15 2025)

#### ⚠️ Pushed to `main`

- Update sign-up-form.tsx ([@haydenbleasel](https://github.com/haydenbleasel))

#### Authors: 1

- Hayden Bleasel ([@haydenbleasel](https://github.com/haydenbleasel))

---

# v1.0.2 (Thu May 15 2025)

#### ⚠️ Pushed to `main`

- Update middleware.ts ([@haydenbleasel](https://github.com/haydenbleasel))

#### Authors: 1

- Hayden Bleasel ([@haydenbleasel](https://github.com/haydenbleasel))

---

# v1.0.1 (Thu May 15 2025)

#### ⚠️ Pushed to `main`

- Update hero.tsx ([@haydenbleasel](https://github.com/haydenbleasel))

#### Authors: 1

- Hayden Bleasel ([@haydenbleasel](https://github.com/haydenbleasel))

---

# v1.0.0 (Thu May 15 2025)

#### 💥 Breaking Change

- v1 [#51](https://github.com/haydenbleasel/crafty/pull/51) ([@haydenbleasel](https://github.com/haydenbleasel))

#### Authors: 1

- Hayden Bleasel ([@haydenbleasel](https://github.com/haydenbleasel))

---

# v0.0.1 (Thu May 15 2025)

:tada: This release contains work from a new contributor! :tada:

Thank you, Hayden Bleasel ([@haydenbleasel](https://github.com/haydenbleasel)), for all your work!

#### 🐛 Bug Fix

- Launch [#49](https://github.com/haydenbleasel/crafty/pull/49) ([@haydenbleasel](https://github.com/haydenbleasel))
- Migrate to Supabase [#1](https://github.com/haydenbleasel/crafty/pull/1) ([@haydenbleasel](https://github.com/haydenbleasel))

#### ⚠️ Pushed to `main`

- Update auto ([@haydenbleasel](https://github.com/haydenbleasel))
- Update package.json ([@haydenbleasel](https://github.com/haydenbleasel))
- For #7 ([@haydenbleasel](https://github.com/haydenbleasel))
- Add error titles ([@haydenbleasel](https://github.com/haydenbleasel))
- Tooltip fixes ([@haydenbleasel](https://github.com/haydenbleasel))
- Update page.tsx ([@haydenbleasel](https://github.com/haydenbleasel))
- Add regenerate buttons ([@haydenbleasel](https://github.com/haydenbleasel))
- Misc fix ([@haydenbleasel](https://github.com/haydenbleasel))
- Update demo.ts ([@haydenbleasel](https://github.com/haydenbleasel))
- Update layout.tsx ([@haydenbleasel](https://github.com/haydenbleasel))
- Only parse direct incomers ([@haydenbleasel](https://github.com/haydenbleasel))
- Update index.tsx ([@haydenbleasel](https://github.com/haydenbleasel))
- Fix audio ([@haydenbleasel](https://github.com/haydenbleasel))
- Rework to use `generated` prop ([@haydenbleasel](https://github.com/haydenbleasel))
- Misc naming fixes ([@haydenbleasel](https://github.com/haydenbleasel))
- Misc fixes ([@haydenbleasel](https://github.com/haydenbleasel))
- Update create.ts ([@haydenbleasel](https://github.com/haydenbleasel))
- Remove redundant transcription ([@haydenbleasel](https://github.com/haydenbleasel))
- Finish image generation ([@haydenbleasel](https://github.com/haydenbleasel))
- Drop node fixes ([@haydenbleasel](https://github.com/haydenbleasel))
- Pre compute transcriptions ([@haydenbleasel](https://github.com/haydenbleasel))
- Update transform.tsx ([@haydenbleasel](https://github.com/haydenbleasel))
- Parse image descriptions ([@haydenbleasel](https://github.com/haydenbleasel))
- Make vision and transcription model configurable ([@haydenbleasel](https://github.com/haydenbleasel))
- Isolate connection validity logic ([@haydenbleasel](https://github.com/haydenbleasel))
- Finish text transform ([@haydenbleasel](https://github.com/haydenbleasel))
- Start building node logic ([@haydenbleasel](https://github.com/haydenbleasel))
- Delete transcribe node ([@haydenbleasel](https://github.com/haydenbleasel))
- Cleanup node types ([@haydenbleasel](https://github.com/haydenbleasel))
- Merge audio nodes ([@haydenbleasel](https://github.com/haydenbleasel))
- Merge video nodes ([@haydenbleasel](https://github.com/haydenbleasel))
- Merge image nodes ([@haydenbleasel](https://github.com/haydenbleasel))
- Merge text nodes ([@haydenbleasel](https://github.com/haydenbleasel))
- Remove transform nodes from toolbar ([@haydenbleasel](https://github.com/haydenbleasel))
- Add transform / primitive switcher ([@haydenbleasel](https://github.com/haydenbleasel))
- Flatten primitive nodes ([@haydenbleasel](https://github.com/haydenbleasel))
- Update next.config.ts ([@haydenbleasel](https://github.com/haydenbleasel))
- Update transcribe.tsx ([@haydenbleasel](https://github.com/haydenbleasel))
- Responsive fixes ([@haydenbleasel](https://github.com/haydenbleasel))
- Split up transform nodes ([@haydenbleasel](https://github.com/haydenbleasel))
- Start breaking up nodes ([@haydenbleasel](https://github.com/haydenbleasel))
- Fix incoming parser ([@haydenbleasel](https://github.com/haydenbleasel))
- Fix paths ([@haydenbleasel](https://github.com/haydenbleasel))
- Merge in waitlist ([@haydenbleasel](https://github.com/haydenbleasel))
- Update inner.tsx ([@haydenbleasel](https://github.com/haydenbleasel))
- Type fixes ([@haydenbleasel](https://github.com/haydenbleasel))
- Finish drafting speech transform node ([@haydenbleasel](https://github.com/haydenbleasel))
- Update model-selector.tsx ([@haydenbleasel](https://github.com/haydenbleasel))
- Add project settings ([@haydenbleasel](https://github.com/haydenbleasel))
- Save previews to DB ([@haydenbleasel](https://github.com/haydenbleasel))
- Add ability to create projects ([@haydenbleasel](https://github.com/haydenbleasel))
- Finish implementing saving ([@haydenbleasel](https://github.com/haydenbleasel))
- Add database and projects ([@haydenbleasel](https://github.com/haydenbleasel))
- Store width / height for media ([@haydenbleasel](https://github.com/haydenbleasel))
- Fix padding and uploaders on media nodes ([@haydenbleasel](https://github.com/haydenbleasel))
- Finish audio uploads and transform transcription ([@haydenbleasel](https://github.com/haydenbleasel))
- Start working on file uploads ([@haydenbleasel](https://github.com/haydenbleasel))
- Scaffold automatic transcription ([@haydenbleasel](https://github.com/haydenbleasel))
- Delete unused images ([@haydenbleasel](https://github.com/haydenbleasel))
- Add dynamic image models ([@haydenbleasel](https://github.com/haydenbleasel))
- Remove proximity connections ([@haydenbleasel](https://github.com/haydenbleasel))
- Fix theme switcher ([@haydenbleasel](https://github.com/haydenbleasel))
- Improve design of Auth ([@haydenbleasel](https://github.com/haydenbleasel))
- Build fixes ([@haydenbleasel](https://github.com/haydenbleasel))
- Patch Kibo UI editor issues ([@haydenbleasel](https://github.com/haydenbleasel))
- Add vercel analytics ([@haydenbleasel](https://github.com/haydenbleasel))
- Update images ([@haydenbleasel](https://github.com/haydenbleasel))
- Add dark mode support ([@haydenbleasel](https://github.com/haydenbleasel))
- Update files ([@haydenbleasel](https://github.com/haydenbleasel))
- Scaffold env ([@haydenbleasel](https://github.com/haydenbleasel))
- Misc fixes, group models ([@haydenbleasel](https://github.com/haydenbleasel))
- Isolate chat models ([@haydenbleasel](https://github.com/haydenbleasel))
- Start working on model selection ([@haydenbleasel](https://github.com/haydenbleasel))
- Finish redesigning cards ([@haydenbleasel](https://github.com/haydenbleasel))
- Start working on design updates ([@haydenbleasel](https://github.com/haydenbleasel))
- Fix transform nodes, add "esc" shortcut to drop node ([@haydenbleasel](https://github.com/haydenbleasel))
- Make transform nodes compute their own prompts ([@haydenbleasel](https://github.com/haydenbleasel))
- Update text.tsx ([@haydenbleasel](https://github.com/haydenbleasel))
- Add more scaffolding nodes ([@haydenbleasel](https://github.com/haydenbleasel))
- UI fixes ([@haydenbleasel](https://github.com/haydenbleasel))
- Rebuild drop node ([@haydenbleasel](https://github.com/haydenbleasel))
- Add focus button ([@haydenbleasel](https://github.com/haydenbleasel))
- Start working on toolbar ([@haydenbleasel](https://github.com/haydenbleasel))
- Fix handle code ([@haydenbleasel](https://github.com/haydenbleasel))
- Prevent cyclic connections ([@haydenbleasel](https://github.com/haydenbleasel))
- Offset edges ([@haydenbleasel](https://github.com/haydenbleasel))
- Add animated connection line ([@haydenbleasel](https://github.com/haydenbleasel))
- Add animated edges ([@haydenbleasel](https://github.com/haydenbleasel))
- Start working on proximity ([@haydenbleasel](https://github.com/haydenbleasel))
- Draft node toolbar ([@haydenbleasel](https://github.com/haydenbleasel))
- Add ability to resize node ([@haydenbleasel](https://github.com/haydenbleasel))
- Start working on drop connect ([@haydenbleasel](https://github.com/haydenbleasel))
- Add tooltips ([@haydenbleasel](https://github.com/haydenbleasel))
- Add image support ([@haydenbleasel](https://github.com/haydenbleasel))
- Create node layout ([@haydenbleasel](https://github.com/haydenbleasel))
- Add auth screens, misc fixes ([@haydenbleasel](https://github.com/haydenbleasel))
- Update canvas.tsx ([@haydenbleasel](https://github.com/haydenbleasel))
- Start working on AI logic ([@haydenbleasel](https://github.com/haydenbleasel))
- Update primary color, add transform node ([@haydenbleasel](https://github.com/haydenbleasel))
- Add Clerk ([@haydenbleasel](https://github.com/haydenbleasel))
- Add Tailwind typography ([@haydenbleasel](https://github.com/haydenbleasel))
- Split out toolbar ([@haydenbleasel](https://github.com/haydenbleasel))
- Draft image and text nodes ([@haydenbleasel](https://github.com/haydenbleasel))
- Update biome.json ([@haydenbleasel](https://github.com/haydenbleasel))
- Draft toolbar ([@haydenbleasel](https://github.com/haydenbleasel))
- Install tw-animate-css ([@haydenbleasel](https://github.com/haydenbleasel))
- Install all components ([@haydenbleasel](https://github.com/haydenbleasel))
- Install shadcn/ui ([@haydenbleasel](https://github.com/haydenbleasel))
- Scaffold canvas ([@haydenbleasel](https://github.com/haydenbleasel))
- Add Ultracite ([@haydenbleasel](https://github.com/haydenbleasel))
- Initial commit from Create Next App ([@haydenbleasel](https://github.com/haydenbleasel))

#### Authors: 1

- Hayden Bleasel ([@haydenbleasel](https://github.com/haydenbleasel))
