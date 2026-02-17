# Аудит фронтенда и рекомендации по переходу с «контрактной» модели на backend/API

## Контекст
Сейчас фронтенд смешивает две модели:
1. **Web2/server-driven** (через `/api/v1/...`).
2. **Web3/контракт-driven** (TON wallet, lamports/SOL, тексты про smart contract).

Если по продуктовой логике теперь **источник истины — сервер + БД**, лучше сделать последовательную миграцию и убрать «контрактные» допущения из UI/UX, названий и текстов.

---

## Что уже видно в `client/src`

### 1) Юридические и support-тексты всё ещё про смарт-контракт
- `pages/TermsPage.tsx`: секция целиком описывает работу через smart contract.
- `pages/ContactsPage.tsx`: формулировки «interface issue or suspect incorrect smart‑contract behaviour».

**Риск:** пользователь получает неверную юридическую/операционную модель, а саппорт — нерелевантные тикеты.

### 2) Конфигурация и нейминг привязаны к «contract/program»
- `config/contract.ts`, `PROGRAM_ID`, `getProgram`, `deriveOceanPda`.

**Риск:** даже если фактическая логика на backend, кодовая база подсказывает разработчикам противоположное и увеличивает вероятность регрессий при изменениях.

### 3) В доменной логике и UI сильная привязка к lamports/SOL
- `core/constants.ts`: `LAMPORTS_PER_SOL`, `MIN_FEED_LAMPORTS`, `MIN_DEPOSIT_LAMPORTS`.
- `pages/FishPage.tsx`, `pages/StartGamePage.tsx`: расчёты и валидации через lamports/SOL, сообщения про контракт.

**Риск:** неверные единицы измерения и неконсистентность, если backend уже оперирует своими денежными единицами/правилами.

### 4) Кошелёк глубоко прошит в основной UX
- `main.tsx`: `TonConnectUIProvider`.
- `wallet/*`, `components/Header.tsx`, `components/WalletDropdown.tsx`, `components/ProfileButton.tsx` и др.

**Риск:** тяжело развивать классическую auth-модель (telegram/web auth/session) и бизнес-флоу без кошелька.

### 5) Смешанный data layer
- Есть API-слой (`shared/api/*`, `features/ocean/api/ocean.api.ts`), но рядом остаются блокчейн-специфичные абстракции.

**Риск:** раздвоенная архитектура, дублирование правил и сложные баги из-за разных источников данных.

---

## Рекомендованный план миграции (без поломки продакшена)

### Этап 1 — Тексты и коммуникация (быстрый, низкий риск)
1. Убрать из UI/доков упоминания smart contract там, где логика уже серверная.
2. Заменить формулировки на «игровой сервер», «backend-обработка», «база данных», «транзакция в системе».
3. Обновить Terms/Privacy/Contacts синхронно, чтобы не было конфликтующих юридических текстов.

### Этап 2 — Доменные единицы и типы
1. Ввести нейтральные типы денег: `MoneyAtomic`, `CurrencyCode` или `GameAmount`.
2. Убрать из UI прямые `lamports`/`SOL`-конверсии; форматировать суммы через единый helper.
3. Правила (минимальный депозит/комиссия) отдавать с backend-конфига (`/api/v1/config`).

### Этап 3 — Конфиг и нейминг
1. `config/contract.ts` переименовать в `config/runtimeGame.ts` (или аналог).
2. `PROGRAM_ID`, `getProgram` и т.д. заменить на backend-термины (`serviceId`, `tenantId`, `oceanConfig`, ...), если они реально нужны.
3. Временный compatibility-слой оставить на 1–2 релиза (deprecated wrappers), потом удалить.

### Этап 4 — Авторизация и идентичность
1. Отвязать ключевые пользовательские действия от обязательного wallet connect.
2. Ввести `UserIdentity` (id, authProvider, displayName) отдельно от `WalletIdentity`.
3. Wallet оставить как **опциональный метод платежа/идентификации**, если это бизнес-требование.

### Этап 5 — Data layer и источники истины
1. Формально зафиксировать: единственный source of truth — backend API.
2. Любые «локальные зеркала правил» (комментарии «mirror of on-chain») заменить на «fetched from backend config».
3. Для событий охоты/прибыли — polling/SSE/WebSocket из backend, без псевдо-onchain терминологии.

---

## Приоритетная очередь файлов для рефакторинга

1. **Срочно (контент/коммуникация):**
   - `pages/TermsPage.tsx`
   - `pages/ContactsPage.tsx`
2. **Домен и расчёты:**
   - `core/constants.ts`
   - `pages/StartGamePage.tsx`
   - `pages/FishPage.tsx`
3. **Архитектурный нейминг:**
   - `config/contract.ts`
4. **Identity/UI доступа:**
   - `main.tsx`
   - `wallet/*`
   - `components/Header.tsx`, `components/WalletDropdown.tsx`

---

## Как лучше поступить practically

Оптимальная стратегия: **сначала контент + термины, затем доменные типы денег, затем постепенный вынос wallet в optional feature-flag**.

Это даст:
- быстрый видимый результат без риска сломать геймплей;
- снижение путаницы у пользователей и команды;
- контролируемую миграцию без большого «big bang».

---

## Что сделать следующим шагом

Предлагаю в следующем PR выполнить «Этап 1» полностью:
- переписать `TermsPage` и `ContactsPage` под серверную модель;
- пройтись по пользовательским error-сообщениям (`StartGamePage`, `FishPage`, `TxOverlay`) и убрать формулировки про контракт;
- добавить чек-лист терминов (запрещённые: `smart contract`, `programId`, `on-chain` в UI-текстах).
