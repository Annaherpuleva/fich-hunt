import { CSSProperties } from "react";

export type Language = 'ru' | 'en';

export interface LandingStatItem {
  value: string;
  label: string;
}

export interface LandingStatsSection {
  oceanVolume: LandingStatItem;
  fishCount: LandingStatItem;
  redistributed: LandingStatItem;
  victims7d: LandingStatItem;
  oceanRatingButton: string;
}

export interface LandingAboutSection {
  title: TextToken;
  description: TextToken;
  cta: string;
  badge: string;
}

export interface LandingStepItem {
  title: string;
  description: string;
  badge?: string
}

export interface QuoteInfoItem {
  title: string;
  description: string;
}

export interface LandingHowItWorksSection {
  steps: {
    createFish: LandingStepItem;
    feedFish: LandingStepItem;
    hunt: LandingStepItem;
    rules: LandingStepItem;
  };
}
export type TextToken =
  | string
  | {
      text: string;
      style?: CSSProperties;
      class?: string;
    }[];
export interface Translations {
  footer: {
    allRightsReserved: string;
    termsOfService: string;
    privacyPolicy: string;
    about: string;
    contacts: string;
  };
  // Common
  loading?: string;
  empty?: string;
  // Header
  connectWallet: string;
  signIn: string;
  menu: string;
  
  // Wallet dropdown
  connectWalletTitle: string;
  detected: string;
  install: string;
  anotherWallets: string;
  cancel: string;
  disconnectWallet: string;
  
  // Language dropdown
  selectLanguage: string;
  
  // Profile dropdown
  language: string;
  
  // Main page
  welcomeTitle: TextToken;
  welcomeDescription: TextToken;
  landingCta: string;
  landingStats: LandingStatsSection;
  landingAbout: LandingAboutSection;
  landingAbout2: LandingAboutSection;
  landingPromo: {
    tag: string;
    title: string;
    description: TextToken;
    cta: string;
  };
  landingPromoVisual: {
    alt: string;
  };
  landingPassive: {
    left: {
      title: TextToken;
      description: TextToken;
      badge: string;
      cta: string;
      descriptionBold?: string[];
    };
    right: {
      title: TextToken;
      cta: string;
    };
  };
  landingTrust: {
    transparency: {
      title: string;
      description: TextToken;
      badge: string;
      cta: string;
    };
    proof: {
      title: string;
      description: string;
    };
  };
  landingFairness: {
    badge: string;
    title: string;
    description: TextToken;
    cta: string;
  };
  landingFaq: {
    questions: string[];
    answers: string[];
  };
  landingHowItWorks: LandingHowItWorksSection;
  landingExit: {
    title: string;
    description: string;
  };
  landingQuotes: QuoteInfoItem[];
  myFishTitle?: string;
  backButtonLabel: string;
  fishEventsTitle?: string;
  fishEventsSubtitle?: string;
  fishEventsEmpty: string;
  
  // Start game page
  createFishTitle: string;
  createFishDescription: string;
  fishName: string;
  fishNameError?: string; // "Введите имя жителя"
  fishNameInvalidChars?: string; // "Используйте только латинские буквы и цифры"
  fishNameAlreadyExists: string; // "Такое имя жителя уже занято"
  price: string;
  createFish: string;
  createFishLabel: string;
  // fishPriceInfo: string;
  recentlyInOcean: string;
  newFish: string;
  topFish: string;
  showMore: string;
  priceInSol: string;
  player: string;
  
  // Fish created state
  fishCreatedTitle: string;
  fishCreatedPrice: string;
  startGame: string;
  
  // About game / info page
  emptyPageTitle: string;
  emptyPageDescription: string;
  walletStatus: string;
  connected: string;
  notConnected: string;
  aboutGameTitle?: string;
  aboutGameMenuSubtitle?: string;
  aboutGameHeroTitle?: string;
  aboutGameHeroText?: string;
  aboutGameRulesTitle?: string;
  aboutGameRulesText?: string;
  aboutGameNewsTitle?: string;
  aboutGameNewsText?: string;
  aboutGameTips?: string[];
  aboutGameFaqTitle?: string;
  aboutGameFaqIntro?: string;
  aboutGameFaqItems?: { question: string; answer: string }[];
  navigationInfo: string;
  pageInfo: string;
  menuDisplays: string;
  navigationWorks: string;
  responsiveDesign: string;
  solanaIntegration: string;
  
  // Wallet names
  wallets: {
    phantom: string;
    solflare: string;
    torus: string;
    coinbaseWallet: string;
    trustWallet: string;
    bitKeep: string;
    mathWallet: string;
    coin98: string;
    clover: string;
    ledger: string;
  };
  
  // Languages
  languages: {
    russian: string;
    english: string;
    chinese: string;
  };

  // Tx overlay/modal
  tx: {
    processing: string;
    successTitle: string;
    errorTitle: string;
    actionDone: string; // used like: {actionText} + actionDone
    actionFailed: string; // used like: {actionText} + actionFailed
    signature: string;
    close: string;
  };

  // My fish page actions
  feed: {
    processing: string;
    actionPrefix: string; // e.g., Feeding fish
    failed: string;
    minAmountError?: string;
    confirmModal: {
      title: string;
      text: TextToken;
      confirmLabel: string;
      cancelLabel: string;
    };
  };
  mark: {
    processing: string;
    actionPrefix: string;
    failed: string;
    modalTitle?: string;
    modalDescription?: string;
    modalConfirm: string;
    modalCancel: string;
    modalText: TextToken;
  };

  // Hint blocks
  hint: {
    label: string;
    huntTips: string[];
    myDwellersTips: string[];
  };

  // Profile panel
  profile?: {
    title: string;
    widgetTitle?: string;
    editModeTitle?: string;
    edit: string;
    myBalance: string;
    wallet: string;
    social: string;
    dangerOcean: string;
    yourIncome: string;
    ocean: string;
    oceanTvl?: string;
    totalIncome: string;
    oceanTodayTitle?: string;
    activeFish?: string;
    eaten7d?: string;
    redistributed7d?: string;
  };

  // Fish card common labels
  feedButtonLabel?: string;
  hungerIn: string; // "Голод через"
  huntButtonLabel: string; // "Охотиться"
  markButtonLabel: string; // "Поставить метку"
  markAlreadyPlaced: string; // "Метка уже поставлена"
  markBurnedLabel: string;
  markBurnedText: TextToken;
  blackMarkExpiresIn?: string; // "Чёрная метка истечёт через"
  myMarkExpiresIn?: string; // "Вы поставили метку. Истекает"
  biteButtonLabel: string; // "вы получите {amount}"
  biteActionText: string; // "Укусить"
  cooldownTooltipText: string;
  willBeVictimIn?: string; // "Станет жертвой через"
  victim: string; // "Жертва"
  fishHungry?: string; // "Житель голоден"
  deadKilled: string; // "Убит в океане"
  fishFullLabel: string; // "Житель сыт"
  reviveLabel?: string; // "Возродить" button label
  deadInfo: string; // dead fish info paragraph

  // Fish page labels
  myFishBackButton: string;
  myFishBreadcrumb: string;
  huntLabel: string;
  analyticsLabel?: string;
  shareToSocialLabel: string;
  dwellerGrowthChart: string;
  shareModal?: {
    title?: string;
    close?: string;
    copyLink?: string;
    linkCopied?: string;
  };
  hideFishLabel?: string;
  hideFishModal?: {
    question?: string;
    confirm?: string;
    cancel?: string;
    processing?: string;
  };
  sellFishLabel?: string;
  redOceanNotice: TextToken;
  availableForHuntLabel?: string;
  recentActionsLabel?: string;
  growFishButton?: string;
  over24hLabel?: string;
  freshFishLabel?: string;
  totalIncomeLabel?: string;
  huntIncomeLabel?: string;
  oceanIncomeLabel?: string;
  noSuitablePreyHint: string;

  // Ocean events
  ocean: {
    happenings: string;
    yourShare: string;
    goodHunt: string;
    newInOcean: string;
    leftOcean: string;
    nothingHappened?: string;
  };
  // Event names mapping
  eventNames: {
    FishCreated: string;
    FishExited: string;
    FishFed: string;
    FishHunted: string;
    FishResurrected: string;
    FishTransferred: string;
    HuntingMarkPlaced: string;
    OceanModeChanged: string;
    Unknown?: string;
  };
  // Additional comments under event title
  fishAtePrey?: string;
  fishCreated?: string;
  fishExited?: string;
  fishWasHungry: string;
  // Optional ranks for top block avatars
  ranks?: {
    rank1: string;
    rank2: string;
    rank3: string;
  };

  // Sell modal
  sell: {
    modalConfirmPrefix: string; // e.g., "Продать за" / "Sell for"
    modalBody: TextToken;
    modalCancel: string;
    processing: string;
    failed: string;
  };

  // Gift modal
  gift?: {
    title?: string;
    placeholder?: string;
    confirm?: string;
    cancel?: string;
    processing?: string;
    failed?: string;
    invalidAddress?: string;
  };
  reviveModal?: {
    title?: string;
    confirm?: string;
    cancel?: string;
    processing?: string;
    placeholder?: string;
    body?: string;
    amountLabel?: string;
    amountPlaceholder?: string;
    solSuffix?: string;
    minAmountError?: string;
  };
  noFishYet: string;
  noFishFound: string;
  hideDwellersWithMark: string;
  showPreyFrom: string;
}

export const translations: Record<Language, Translations> = {
  ru: {
    // Footer
    footer: {
      allRightsReserved: 'Все права защищены.',
      termsOfService: 'Условия использования',
      privacyPolicy: 'Политика конфиденциальности',
      about: 'О проекте',
      contacts: 'Контакты',
    },
    loading: 'Загрузка...',
    empty: 'Пока нет данных',
    // Header
    connectWallet: 'Connect Wallet',
    signIn: 'Войти',
    menu: 'Меню',
    
    // Wallet dropdown
    connectWalletTitle: 'Подключить кошелек',
    detected: 'Обнаружен',
    install: 'Установить',
    anotherWallets: 'Другие кошельки',
    cancel: 'Отмена',
    disconnectWallet: 'Отключить кошелек',
    
    // Language dropdown
    selectLanguage: 'Выбор языка',
    
    // Profile dropdown
    language: 'Язык',
    
    // Main page
    welcomeTitle: [
      { text: 'Перестань быть добычей, стань ' },
      {
        text: 'хищником',
        style: {
          background: 'linear-gradient(90deg,rgb(86, 176, 255) 0%, rgb(210, 235, 255) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        },
      },
    ],
    welcomeDescription: [{
      text: 'Крипторынок — беспощадный океан',
      style: { fontWeight: 'bold' }
    }, {
      text: ', где киты пожирают мелких игроков.',
    }, {
      text: '\nHODL HUNT',
      style: { fontWeight: 'bold', whiteSpace: 'pre-line' }
    }, {
      text: ' меняет правила: теперь именно ты можешь стать охотником, а не жертвой.',
    }],
    landingCta: 'Начать охоту',
    landingStats: {
      oceanVolume: { value: '1142', label: 'Объем океана TON' },
      fishCount: { value: '527', label: 'Жителей' },
      redistributed: { value: '38', label: 'Распределено TON' },
      victims7d: { value: '218', label: 'Жертв за 7 дней' },
      oceanRatingButton: 'Рейтинг жителей',
    },
    landingAbout: {
      title: [
        { text: 'HODL HUNT', style: { fontWeight: 'bold' } },
        { text: ' — DeFi-протокол с элементом PvP на TON, который геймифицированный под игру.' },
      ],
      description: 'Ты создаёшь морского жителя с весом в TON, кормишь его раз в 7 дней и охотишься на жителей, которых не покормили, забирая их TON при укусе.',
      cta: 'Создать жителя',
      badge: 'Audited by Block Solutions B+',
    },
    landingPassive: {
      left: {
        title: [
          { text: 'Зарабатывай даже', style: {display: 'block'} },
          { text: 'без охоты' },
        ],
        description: [
          { text: 'Даже если ты не охотишься, твой житель получает часть комиссии, которую игровая система начисляет с действий других игроков: создание жителя, кормление, метки, охота и продажа жителя.' },
          { text: 'Это не доходность из воздуха, как в пирамидах.', style: {display: 'block', marginTop: '20px'} },
          { text: 'Это часть реальной комиссии игры, половина которой автоматически распределяется между жителями игроков.' },
        ],
        badge: 'Океан сам тебя кормит',
        cta: 'Начать охоту',
      },
      right: {
        title: [
          {text: 'Что происходит'},
          {text: 'в океане?', style: {display: 'block'}},
        ],
        cta: 'Войти в океан',
      },
    },
    landingAbout2: {
      title: 'Честная игра без обмана',
      description: [
        { text: 'HODL HUNT', class: 'font-bold' },
        { text: ' работает как серверный игровой сервис. Операции обрабатываются по единым backend-правилам без ручных подкруток в пользовательских сценариях.' },
        { text: 'Все правила задаются в backend-конфигурации и применяются одинаково для всех игроков. Источник истины — сервер и база данных, а критичные операции проходят через подтверждение пользователя и системную валидацию.', class: 'block mt-[20px]' }
      ],
      badge: 'Ты контролируешь результат',
      cta: 'Посмотреть системные правила',
    },
    landingPromo: {
      tag: 'Стань охотником',
      title: 'Каждая ошибка других игроков твой доход',
      description: [
        { text: 'Если кто-то не покормил своего жителя, ты кусаешь и забираешь 80% его веса в TON.', class: 'block mb-[20px]' },
        { text: 'Чем больше игроки ошибаются, тем больше ты зарабатываешь.' },
      ],
      cta: 'Начать охоту',
    },
    landingPromoVisual: {
      alt: 'Синяя рыба HODL HUNT с агрессивным выражением и кнопкой play',
    },
    landingFaq: {
      questions: [
        'Это очередной скам?',
        'Не поздно ли заходить?',
        'Нужно много времени и знаний?',
        'Киты не съедят мелких игроков?',
        'Чем я рискую?',
        'Куда уходит админский процент и что работает сразу после создания жителя?',
      ],
      answers: [
        'HODL HUNT ориентирован на прозрачные правила. Игровая логика обрабатывается backend-сервисом, а состояние хранится в базе данных и проверяется через API. Для пользователей нет скрытых кнопок управления в игровых сценариях: действия подтверждаются и проходят валидацию по единым правилам.',
        'Здесь время входа ничего не решает. Можно зайти в любой момент. Важно только то, как ты играешь и какие решения принимаешь.',
        'Нет. Главное не забывать кормить жителя раз в 7 дней, чтобы его никто не смог укусить и забрать ваши TON. Всё остальное опционально. Можно заходить в любое время, охотиться или просто наблюдать. Интерфейс ведёт тебя сам, без сложных схем и DeFi-заморочек.',
        'В HODL HUNT нет привилегий для крупных игроков. Неважно, какой у тебя депозит и какого ты размера. Если твой житель покормлен, его невозможно укусить и забрать его TON. Потерять средства можно только в одном случае: если ты не покормил своего жителя до истечения таймера голода. После этого он становится жертвой и доступен для укуса другими игроками.',
        'Ты рискуешь только своими TON в игре. Потерять их можно, если не покормить жителя до истечения таймера голода 7 дней: тогда другие игроки могут укусить его и забрать его вес в TON. Система не списывает средства произвольно — действия выполняются только по правилам игры и фиксируются backend-сервисом.',
        'Сервисная комиссия распределяется автоматически backend-логикой в момент подтверждённого действия: часть идёт на операционные расходы и развитие, часть — в игровую экономику океана. После создания житель сразу получает базовые механики: защиту от охоты на 7 дней, стартовые таймеры и участие в общей экономике по действующим правилам.',
      ],
    },
    landingTrust: {
      transparency: {
        title: 'Океан сам создаёт жертв для охоты',
        description: [
          { text: 'В HODL HUNT часть комиссии, которую получают разработчики, направляется в суверенный фонд океана. Эти средства не тратятся напрямую, а размещаются в DeFi-протоколах для получения доходности.' },
          { text: 'В игру возвращается только полученная доходность. На неё фонд создаёт морских жителей и специально не кормит их, чтобы со временем они становились жертвами. Это поддерживает экономику игры и создаёт новые цели для охоты без зависимости от притока новых игроков.', class: 'block my-[20px]' },
          { text: 'Чем выше активность в океане, тем больше фонд. Чем больше фонд, тем больше жертв возвращается в игру.' },
        ],
        badge: 'Суверенный фонд океана',
        cta: 'Начать охоту',
      },
      proof: {
        title: 'Экономика работает без притока новых игроков',
        description:
          'Суверенный фонд океана использует доходность, полученную в DeFi-протоколах, и превращает её в добычу внутри игры, стимулируя экономику HODL HUNT без притока новых игроков.',
      },
    },
    landingFairness: {
      badge: 'Равные правила для всех',
      title: 'Справедливые условия',
      description: [
        {
          text: 'Большинство игроков проигрывают не из-за глупости.',
          class: 'block',
        },
        {
          text: 'Они проигрывают, потому что правила против них.',
          class: 'block mb-[20px]',
        },
        {
          text: 'В HODL HUNT правила одинаковы для всех.',
          class: 'block',
        },
        {
          text: 'Ты действуешь сам. Результат зависит только от твоих решений.',
          class: 'block',
        },
      ],
      cta: 'Начать охоту',
    },
    landingHowItWorks: {
      steps: {
        createFish: {
          badge: 'Как это работает?',
          title: 'Создай морского жителя',
          description: 'Ты задаёшь вес жителя в TON — это и будет его вес в игре. После создания житель считается покормленным на 7 дней и недоступен для охоты.',
        },
        feedFish: {
          title: 'Корми раз в 7 дней',
          description: 'Каждое кормление запускает новый 7-дневный период защиты. Кормить можно в любое время, но если не успеешь до истечения срока защиты, твой житель переходит в статус жертвы и становится доступен для охоты.',
          badge: 'Сытый житель защищен',
        },
        hunt: {
          title: 'Зарабатывай +80% за каждую охоту',
          description: 'Если другой игрок не покормил своего жителя по истечении таймера защиты, ты можешь укусить его в один клик и забрать 80% его веса в TON.',
          badge: 'Охота — способ быстро расти',
        },
        rules: {
          title: 'Проверь код сам',
          description: 'Каждое действие в HODL HUNT фиксируется backend-сервисом. Игрок может проверить историю операций и актуальные правила через API и интерфейс игры.',
        },
      },
    },
    landingExit: {
      title: 'Выйди из игры в любой момент',
      description: 'Морские жители в HODL HUNT — это не NFT, которые нужно продавать другому игроку, чтобы вернуть свои TON. В спокойном режиме океана ты можешь продать своего жителя в любой момент, а backend-сервис рассчитает сумму возврата TON по текущему весу с учётом комиссии из правил.\nРежим океана меняется каждый день в 00:00 UTC по правилам системы. В спокойном режиме выход доступен, в опасном режиме выход временно недоступен и необходимо дождаться смены режима на спокойный океан.\nТебе не нужно искать покупателей или ликвидность. Продажа жителя выполняется как системная операция через backend без участия других игроков.',
    },
    landingQuotes: [
      {
        title: 'Без мусорных токенов',
        description: 'Игра использует только нативный TON — без игровых токенов и искусственной эмиссии.',
      },
      {
        title: 'Без скама',
        description: 'Правила игры публикуются backend-сервисом и применяются единообразно. Изменения проходят через релизы и прозрачные обновления конфигурации, без привилегий для отдельных игроков.',
      },
      {
        title: 'Без обмана',
        description: 'Каждое действие в игре фиксируется backend-сервисом, а историю можно проверить в интерфейсе и через API.',
      },
      {
        title: 'Без инсайдов',
        description: 'Нет скрытых кнопок или привилегированных аккаунтов — все играют по одним и тем же правилам. Решают только твои действия и стратегия.',
      },
    ],
    myFishTitle: 'Мои жители',
    backButtonLabel: 'Назад к жителю',
    fishEventsTitle: 'История событий',
    fishEventsSubtitle: 'Полная история действий выбранного жителя.',
    fishEventsEmpty: 'События отсутствуют',
    
    // Start game page
    createFishTitle: 'Создайте морского жителя',
    createFishDescription: 'Вы можете охотиться только на жителей меньшего веса, чем ваш. После создания житель автоматически считается покормленным на 7 дней. Далее его необходимо кормить раз в 7 дней на 5% или 10% от его веса в зависимости от состояния океана. Если жителя не покормить вовремя, он переходит в статус жертвы и становится доступен для охоты.',
    fishName: 'Имя жителя',
    fishNameError: 'Введите имя жителя',
    fishNameInvalidChars: 'Используйте только латинские буквы и цифры',
    fishNameAlreadyExists: 'Такое имя жителя уже занято',
    price: 'Вес',
    createFish: 'Создать жителя',
    createFishLabel: 'Создать',
    // fishPriceInfo: 'От 0,1 TON вы займете топ 1% в океане и станете недоступны для укусов от жителей меньшего веса',
    recentlyInOcean: 'Недавно в океане',
    newFish: 'Новые жители',
    topFish: 'Топ жителей',
    showMore: 'Показать больше',
    priceInSol: 'Вес в TON',
    player: 'Игрок',
    
    // Fish created state
    fishCreatedTitle: 'Медуза',
    fishCreatedPrice: '0.94 TON',
    startGame: 'Начать игру',
    
    // About game / info page
    emptyPageTitle: 'Об игре HODL HUNT',
    emptyPageDescription: 'HODL HUNT — DeFi-игра на TON, где каждый житель — это ваш депозит в TON. Вы кормите жителя, чтобы он выживал, охотитесь на более лёгких и зарабатываете на комиссиях и охоте.',
    walletStatus: 'Статус кошелька:',
    connected: 'Кошелек подключен',
    notConnected: 'Кошелек не подключен',
    aboutGameTitle: 'Об игре',
    aboutGameMenuSubtitle: 'Как работает HODL HUNT и на чём здесь зарабатывают',
    aboutGameHeroTitle: 'Большая новость',
    aboutGameHeroText:
      "Join the top 1% of candidates and get the offer of your dreams with personalized coaching from those who have successfully navigated the path at McKinsey, Goldman Sachs, and Google.",
    aboutGameRulesTitle: 'Правила игры',
    aboutGameRulesText:
      "Product design is about one-third of the PM interview process. During the interview, you'll develop a product that solves a problem in a way that makes sense for the company and that users will like.\n\nSome common product design interview questions include:\nWhat's your favorite product and why?\nHow would you improve our product?\nDesign a product for drivers during rush hour.\nHow would you improve Instagram Stories?\nHow would you improve Spotify as a podcast application?\n\nThese questions are centered on your product thinking skills like user empathy and user-centered design, feature prioritization, and changing products for better product-market fit.",
    aboutGameNewsTitle: 'Новости океана',
    aboutGameNewsText:
      "Product design is about one-third of the PM interview process. During the interview, you'll develop a product that solves a problem in a way that makes sense for the company and that users will like.",
    aboutGameTips: [
      'Специальный блок (tip/note). Join the top 1% of candidates and get the offer of your dreams with personalized coaching from those who have successfully navigated the path at McKinsey, Goldman Sachs, and Google.',
      'Специальный блок (tip/note). Join the top 1% of candidates and get the offer of your dreams with personalized coaching from those who have successfully navigated the path at McKinsey, Goldman Sachs, and Google.',
    ],
    aboutGameFaqTitle: 'FAQ',
    aboutGameFaqIntro:
      "Product design is about one-third of the PM interview process. During the interview, you'll develop a product that solves a problem in a way that makes sense for the company and that users will like.",
    aboutGameFaqItems: [
      { question: 'Вопрос 1', answer: 'Ответ на вопрос' },
      { question: 'Вопрос 2', answer: 'Ответ на вопрос' },
      { question: 'Вопрос 3', answer: 'Ответ на вопрос' },
      { question: 'Вопрос 4', answer: 'Ответ на вопрос' },
    ],
    navigationInfo: 'Вы можете использовать навигацию вверху, чтобы переключаться между страницами.',
    pageInfo: 'Информация о странице',
    menuDisplays: 'Меню отображается на всех страницах',
    navigationWorks: 'Навигация работает корректно',
    responsiveDesign: 'Адаптивный дизайн для всех устройств',
    solanaIntegration: 'Интеграция с TON Wallet',
    
    // Wallet names
    wallets: {
      phantom: 'Phantom',
      solflare: 'Solflare',
      torus: 'Torus',
      coinbaseWallet: 'Coinbase Wallet',
      trustWallet: 'Trust Wallet',
      bitKeep: 'BitKeep',
      mathWallet: 'Math Wallet',
      coin98: 'Coin98',
      clover: 'Clover',
      ledger: 'Ledger',
    },
    
    // Languages
    languages: {
      russian: 'Русский',
      english: 'English',
      chinese: '中文',
    },

    // Tx overlay/modal
    tx: {
      processing: 'Обработка транзакции...',
      successTitle: 'Транзакция успешно выполнена',
      errorTitle: 'Ошибка транзакции',
      actionDone: ' выполнено.',
      actionFailed: ' не выполнено.',
      signature: 'Сигнатура',
      close: 'Закрыть',
    },

    // My fish page actions
    feed: {
      processing: 'Кормление жителя...',
      actionPrefix: 'Кормление жителя',
      failed: 'Не удалось покормить',
      minAmountError: 'Минимальный депозит 0.01 TON',
      confirmModal: {
        title: 'Подтверждение кормления',
        text: [
          { text: 'Вы собираетесь покормить жителя на ' },
          { text: '{amount} TON.', style: { fontWeight: "bold" } },
          { text: '', style: { display: "block", marginTop: '8px' } },
          { text: 'После кормления охота будет недоступна в течение ' },
          { text: '48 часов.', style: { fontWeight: "bold" } },
        ],
        confirmLabel: 'Покормить',
        cancelLabel: 'Отменить',
      },
    },
    mark: {
      processing: 'Размещение метки...',
      actionPrefix: 'Постановка метки на жителя',
      failed: 'Не удалось поставить метку',
      modalTitle: 'Поставить метку',
      modalDescription: 'Вы собираетесь поставить охотничью метку на выбранного жителя. В течение ограниченного времени только вы можете укусить эту жертву.',
      modalConfirm: 'Поставить метку',
      modalCancel: 'Отменить',
      modalText: [
        { text: '🚨 Метка — это покупка приоритетного права на укус.', style: { display: 'block', fontWeight: 'bold' } },
        { text: 'Если житель не будет покормлен и станет жертвой, только вы сможете укусить его в течение первых 30 минут.', style: { display: 'block', marginTop: '6px' } },
        { text: 'Если жителя покормят до истечения таймера — стоимость метки не возвращается, метка сгорает.', style: { display: 'block', marginTop: '6px' } },
      ],
    },

    // Hint blocks
    hint: {
      label: 'Подсказка',
      huntTips: [
        'Вы можете поставить метку на жителя, у которого таймер голода показывает менее 24 часов. Если житель не покормится и перейдёт в статус жертвы, вы получаете 30 минут эксклюзивного приоритетного окна на укус, в течение которых другие игроки не смогут укусить его. Но если житель, на которого вы поставили метку, покормится, метка сгорает без возврата средств.',
        'Вы можете охотиться только на жителей, которые имеют меньший вес, чем ваш. Увеличьте вес своего жителя, чтобы открыть доступ к ещё {count} потенциальным жертвам.',
      ],
      myDwellersTips: [
        'Половина комиссий с действий других игроков сразу распределяется между жителями пропорционально их весу. Чем больше вес вашего жителя, тем большую долю распределения он получит.',
        'Следите за таймером голода: после кормления житель защищён от укусов на 7 дней.',
      ],
    },

    profile: {
      title: 'Профиль',
      widgetTitle: 'Мой профиль',
      editModeTitle: 'Введите соц.сети',
      edit: 'Изменить',
      myBalance: 'Мой баланс',
      wallet: 'Кошелек',
      social: 'Соцсети',
      dangerOcean: 'Статистика дохода',
      yourIncome: 'Ваш доход',
      ocean: 'Океан',
      oceanTvl: 'Океан (TVL)',
      totalIncome: 'Общий доход',
      oceanTodayTitle: 'Океан сегодня',
      activeFish: 'Активных жителей',
      eaten7d: 'Съедено за 7 дней',
      redistributed7d: 'Перераспределено TON',
    },

    feedButtonLabel: 'Покормить',
    hungerIn: 'Голод через',
    huntButtonLabel: 'Охотиться',
    markButtonLabel: 'Поставить метку',
    markAlreadyPlaced: 'Метка уже поставлена',
    markBurnedLabel: 'Ваша метка сгорела',
    markBurnedText: [
      {text: 'Вы поставили охотничью метку на этого жителя, но его владелец покормил его до наступления голода.'},
      {text: 'Житель не стал жертвой, поэтому ваша метка сгорела.', style: {display: 'block', marginTop: '6px'}}
    ],
    blackMarkExpiresIn: 'Метка истечёт через',
    myMarkExpiresIn: 'Вы поставили метку. Истекает',
    biteButtonLabel: 'вы получите {amount}',
    biteActionText: 'Укусить',
    cooldownTooltipText: 'После создания, кормления или охоты жителю требуется 48 часов восстановления. Используйте это время, чтобы развивать других жителей или планировать охоту.',
    willBeVictimIn: 'Станет жертвой через',
    victim: 'Жертва',
    fishHungry: 'Житель голоден',
    deadKilled: 'Убит в океане',
    fishFullLabel: 'Житель сыт',
    reviveLabel: 'Возродить',
    deadInfo: 'Ваш житель погиб и стал жертвой в океане — его съели или продали, но вы можете возродить его скин и вернуться в игру',

    // Fish page labels (RU)
    myFishBackButton: 'Назад',
    myFishBreadcrumb: 'Мой житель',
    huntLabel: 'Охота',
    analyticsLabel: 'Аналитика',
    shareToSocialLabel: 'Поделиться в соцсетях',
    dwellerGrowthChart: 'График роста жителя',
    shareModal: {
      title: 'Поделиться',
      close: 'Закрыть',
      copyLink: 'Скопировать ссылку',
      linkCopied: 'Ссылка скопирована',
    },
    hideFishLabel: 'Скрыть жителя',
    hideFishModal: {
      question: 'Скрыть мертвого жителя навсегда?',
      confirm: 'Скрыть навсегда',
      cancel: 'Отменить',
      processing: 'Скрываем жителя...',
    },
    sellFishLabel: 'Продать жителя',
    redOceanNotice: [
      { text: '🌩 Продажа жителя недоступна во время ' },
      { text: 'шторма в океане.', style: { fontWeight: 'bold' } },
      { text: '', style: { display: "block", marginTop: '6px' }},
      { text: 'Дождитесь смены режима на ' },
      { text: 'спокойный океан', style: { fontWeight: 'bold' } },
      { text: ', чтобы продать жителя.' },
    ],
    availableForHuntLabel: 'Доступны для охоты',
    recentActionsLabel: 'Последние действия',
    growFishButton: 'Увеличить жителя',
    over24hLabel: 'за 24 часа',
    freshFishLabel: 'Свежий житель',
    totalIncomeLabel: 'Общая доходность:',
    huntIncomeLabel: 'Доход с охоты:',
    oceanIncomeLabel: 'Доход с океана:',
    noSuitablePreyHint: `Подходящих жителей нет, но есть {count} жителей больше вашего. Увеличьте вес жителя, чтобы они отобразились.`,

    ocean: {
      happenings: 'Что происходит в океане',
      yourShare: 'Ваша доля',
      goodHunt: 'Охота на жителя',
      newInOcean: 'Новый житель в океане',
      leftOcean: 'Выход жителя',
      nothingHappened: 'В океане ничего не произошло',
    },
    eventNames: {
      FishCreated: 'Создание жителя',
      FishExited: 'Выход жителя',
      FishFed: 'Кормление жителя',
      FishHunted: 'Охота на жителя',
      FishResurrected: 'Возрождение жителя',
      FishTransferred: 'Передача жителя',
      HuntingMarkPlaced: 'Установка охотничьей метки',
      OceanModeChanged: 'Изменение режима океана',
      Unknown: 'Событие',
    },

    // Additional event comments
    fishAtePrey: 'Житель съел жертву',
    fishCreated: 'Создан житель',
    fishExited: 'Покинул океан',
    fishWasHungry: 'Житель был голоден',

    ranks: {
      rank1: '👑 1 место',
      rank2: '🥈 2 место',
      rank3: '🥉 3 место',
    },

    sell: {
      modalConfirmPrefix: 'Продать за',
      modalBody: [
        { text: 'Вы собираетесь продать жителя.', style: { display: 'block', fontWeight: 'bold', marginBottom: '6px' } },
        { text: 'После продажи вы получите ' },
        { text: '{amount}', style: { fontWeight: 'bold' } },
        { text: ' на свой кошелёк (комиссия уже учтена).' },
        { text: 'Это действие необратимо.', style: { display: 'block', marginTop: '6px' } },
      ],
      modalCancel: 'Отменить',
      processing: 'Продажа жителя...',
      failed: 'Не удалось продать',
    },

    gift: {
      title: 'Отправить подарок',
      placeholder: '🔗 Введите адрес кошелька',
      confirm: 'Подарить',
      cancel: 'Отменить',
      processing: 'Отправка подарка...',
      failed: 'Не удалось отправить подарок',
      invalidAddress: 'Некорректный адрес',
    },
    reviveModal: {
      title: 'Восстановить жителя',
      confirm: 'Восстановить',
      cancel: 'Отменить',
      processing: 'Восстановление жителя...',
      placeholder: 'Введите вес в TON',
      body: 'Укажите вес для восстановления жителя и подтвердите действие.',
      amountLabel: 'Вес восстановления',
      amountPlaceholder: '0.00',
      solSuffix: 'TON',
      minAmountError: 'Минимальный вес 0.01 TON'
    },
    noFishYet: 'Жителей ещё нет',
    noFishFound: 'Жителей не найдено',
    hideDwellersWithMark: 'Не показывать жителей с меткой',
    showPreyFrom: 'Показывать жителей от',
  },
  
  en: {
    footer: {
      allRightsReserved: 'All rights reserved.',
      termsOfService: 'Terms of Service',
      privacyPolicy: 'Privacy Policy',
      about: 'About',
      contacts: 'Contacts',
    },
    loading: 'Loading...',
    empty: 'No data yet',
    // Header
    connectWallet: 'Connect Wallet',
    signIn: 'Sign In',
    menu: 'Menu',
    
    // Wallet dropdown
    connectWalletTitle: 'Connect Wallet',
    detected: 'Detected',
    install: 'Install',
    anotherWallets: 'Another wallets',
    cancel: 'Cancel',
    disconnectWallet: 'Disconnect Wallet',
    
    // Language dropdown
    selectLanguage: 'Select Language',
    
    // Profile dropdown
    language: 'Language',
    
    // Main page
    welcomeTitle: 'Stop being prey, become a predator',
    welcomeDescription: [
      {
        text: 'The crypto market is a ruthless ocean',
        style: { fontWeight: 'bold' },
      },{
        text: ' where whales devour small players.',
      },
      {
        text: '\nHODL HUNT',
        style: { fontWeight: 'bold', whiteSpace: 'pre-line' }
      },
      {
        text: ' changes the rules: now you can be the hunter instead of the prey.',
      },
    ],
    landingCta: 'Start the hunt',
    landingStats: {
      oceanVolume: { value: '1142', label: 'Ocean TVL' },
      fishCount: { value: '527', label: 'Active Dwellers' },
      redistributed: { value: '38', label: 'Redistributed TON' },
      victims7d: { value: '218', label: 'Eaten in 7 days' },
      oceanRatingButton: 'Dweller rankings',
    },
    landingAbout: {
      title: [
        { text: 'HODL HUNT', style: { fontWeight: 'bold' } },
        { text: ' — a DeFi protocol with PvP elements on TON, gamified as a game.' },
      ],
      description: 'You create a Sea Dweller with a weight in TON, feed it once every 7 days, and hunt Dwellers that were not fed, claiming their TON with a bite.',
      cta: 'Create a Dweller',
      badge: 'Audited by Block Solutions B+',
    },
    landingPassive: {
      left: {
        title: [
          { text: 'Earn even', style: { display: 'block' } },
          { text: 'without hunting' },
        ],
        description: [
          {
            text: 'Even if you do not hunt, your Dweller receives a share of the system fees collected from other players’ actions: creation, feeding, marks, hunting, and selling.',
          },
          {
            text: 'This is not yield out of thin air, like in pyramids.',
            style: { display: 'block', marginTop: '20px' },
          },
          {
            text: 'It’s a share of the game’s real fees, half of which is automatically distributed among players’ Dwellers.',
          },
        ],
        badge: 'The ocean itself feeds you',
        cta: 'Start hunting',
      },
      right: {
        title: [
          { text: 'What’s happening' },
          { text: 'in the ocean?', style: { display: 'block' } },
        ],
        cta: 'Enter the ocean',
      },
    },
    landingAbout2: {
      title: 'Fair play without tricks',
      description: [
        {
          text: 'HODL HUNT',
          class: 'font-bold',
        },
        {
          text: ' operates as a server-driven game service. Actions are processed under consistent backend rules without hidden user-facing overrides.',
        },
        {
          text: 'All rules are defined in code in advance and are the same for all players. After the contract is deployed, no one — including the project team — can change the mechanics, influence hunting, fund distribution, or block anyone’s exit.',
          class: 'block mt-[20px]',
        },
      ],
      badge: 'You control the outcome',
      cta: 'View smart-contract',
    },
    landingPromo: {
      tag: 'Become a hunter',
      title: 'Every mistake other players make is your income',
      description: [
        {
          text: 'If someone fails to feed their Dweller, you bite and claim 80% of its weight in TON.',
          class: 'block mb-[20px]',
        },
        {
          text: 'The more players make mistakes, the more you earn.',
        },
      ],
      cta: 'Start hunting',
    },
    
    landingPromoVisual: {
      alt: 'Blue HODL HUNT Dweller with a fierce look and play button overlay',
    },
    landingFaq: {
      questions: [
        'Is this just another scam?',
        'Is it too late to join?',
        'Does it require a lot of time or knowledge?',
        'Will whales eat small players?',
        'What am I risking?',
        'Where does the admin percentage go, and is everything active right after Dweller creation?',
      ],
      answers: [
        'HODL HUNT is focused on transparent gameplay. Core logic is processed by backend services and state is stored in a database exposed via API. There are no hidden user-facing controls in gameplay flows: actions are confirmed and validated under consistent system rules.',
        'Entry timing doesn’t matter here. You can join at any moment. What matters is how you play and the decisions you make.',
        'No. The main thing is to remember to feed your Dweller once every 7 days so no one can bite it and take your TON. Everything else is optional. You can log in anytime, hunt, or simply observe. The interface guides you without complex schemes or DeFi headaches.',
        'HODL HUNT has no privileges for large players. Your deposit size doesn’t matter. If your Dweller is fed, it cannot be bitten and its TON cannot be taken. Funds can only be lost in one case: if you fail to feed your Dweller before the hunger timer expires. At that point, it becomes prey and can be bitten by other players.',
        'You only risk your TON in the game. They can be lost if you do not feed your Dweller before the 7-day hunger timer expires, after which other players can bite your Dweller and take its weight in TON. The system does not withdraw funds arbitrarily — actions follow game rules and are recorded by backend services.',
        'Service fees are distributed automatically by backend logic when an action is confirmed: part goes to operations and product development, and part supports the shared ocean economy. Right after creation, a Dweller has all core mechanics enabled: 7-day hunt protection, initial timers, and participation in the shared economy under active rules.',
      ],
    },
    landingTrust: {
      transparency: {
        title: 'The ocean creates prey for hunting on its own',
        description: [
          {
            text: 'In HODL HUNT, part of the fees received by the developers is directed into the Ocean Sovereign Fund. These funds are not spent directly, but are deployed into DeFi protocols to generate yield.',
          },
          {
            text: 'Only the generated yield is returned to the game. Using it, the fund creates Sea Dwellers and intentionally does not feed them, allowing them to eventually become prey. This supports the game economy and creates new hunting targets without relying on an inflow of new players.',
            class: 'block my-[20px]',
          },
          {
            text: 'The higher the activity in the ocean, the larger the fund. The larger the fund, the more prey is returned to the game.',
          },
        ],
        badge: 'Ocean Sovereign Fund',
        cta: 'Start hunting',
      },
      proof: {
        title: 'The economy works without relying on an inflow of new players',
        description:
          'The Ocean Sovereign Fund uses yield generated in DeFi protocols and converts it into in-game prey, sustaining the HODL HUNT economy without relying on new player inflows.',
      },
    },
    landingFairness: {
      badge: 'Equal rules for everyone',
      title: 'Fair conditions',
      description: [
        {
          text: 'Most players don’t lose because they are careless.',
          class: 'block',
        },
        {
          text: 'They lose because the rules are stacked against them.',
          class: 'block mb-[20px]',
        },
        {
          text: 'In HODL HUNT, the rules are the same for everyone.',
          class: 'block',
        },
        {
          text: 'You act on your own. The outcome depends only on your decisions.',
          class: 'block',
        },
      ],
      cta: 'Start hunting',
    },    
    landingHowItWorks: {
      steps: {
        createFish: {
          badge: 'How does it work?',
          title: 'Create a Sea Dweller',
          description: 'You set the Dweller’s weight in TON — this becomes its in-game weight. After creation, the Dweller is considered fed for 7 days and cannot be hunted.',
        },
        feedFish: {
          title: 'Feed once every 7 days',
          description: 'Each feeding starts a new 7-day protection period. You can feed at any time, but if you miss the protection window, your Dweller enters the prey state and becomes available for hunting.',
          badge: 'A fed Dweller is protected',
        },
        hunt: {
          title: 'Earn +80% from every hunt',
          description: 'If another player fails to feed their Dweller before the protection timer expires, you can bite it in one click and claim 80% of its weight in TON.',
          badge: 'Hunting is the fastest way to grow',
        },
        rules: {
          title: 'Verify the code yourself',
          description: 'Every action in HODL HUNT is recorded by backend services. Any player can verify operation history, rules, and distributions through the API and game interface.',
        },
      },
    },
    landingExit: {
      title: 'Leave the game anytime',
      description: 'Sea Dwellers in HODL HUNT are not NFTs that must be sold to another player in order to get your TON back. In calm ocean mode, you can sell your Dweller at any time, and backend services calculate the TON return by current weight minus the fee defined in rules.\nOcean mode changes every day at 00:00 UTC according to system rules. In calm mode, exiting is available; in dangerous mode, exiting is temporarily unavailable and you must wait for calm mode.\nYou do not need to search for buyers or liquidity. Selling a Dweller is a backend system operation without involving other players.',
    },
    landingQuotes: [
      {
        title: 'No junk tokens',
        description: 'Everything runs on TON — real crypto, no play tokens that will crash.',
      },
      {
        title: 'No scam',
        description: 'Rules are published through backend releases, and user funds are processed only through confirmed system operations.',
      },
      {
        title: 'No cheating',
        description: 'Every move is recorded by backend services and visible in in-game history/API — transparent operations.',
      },
      {
        title: 'No insiders',
        description: 'No privileged access for chosen few — only your actions and strategy matter.',
      },
    ],
    myFishTitle: 'My Dweller',
    backButtonLabel: 'Back to Dwellers',
    fishEventsTitle: 'Event history',
    fishEventsSubtitle: 'Full timeline of actions for this Dweller.',
    fishEventsEmpty: 'No events yet',
    
    // Start game page
    createFishTitle: 'Create a Sea Dweller',
    createFishDescription: 'You can only hunt Dwellers with less weight than yours. After creation, a Dweller is automatically considered fed for 7 days. After that, it must be fed once every 7 days with 5% or 10% of its weight, depending on the ocean state. If a Dweller is not fed in time, it enters the prey state and becomes available for hunting.',
    fishName: 'Dweller name',
    fishNameError: 'Enter Dweller name',
    fishNameInvalidChars: 'Use only Latin letters and numbers',
    fishNameAlreadyExists: 'This Dweller name is already taken',
    price: 'Price',
    createFish: 'Create Dweller',
    createFishLabel: 'Create',
    // fishPriceInfo: 'From 0.1 TON you will take the top 1% in the ocean and become unavailable for bites from cheaper Dwellers',
    recentlyInOcean: 'Recently in the ocean',
    newFish: 'New Dwellers',
    topFish: 'Top Dwellers',
    showMore: 'Show more',
    priceInSol: 'Price in TON',
    player: 'Player',
    
    // Fish created state
    fishCreatedTitle: 'Jellyfish',
    fishCreatedPrice: '0.94 TON',
    startGame: 'Start Game',
    
    // About game / info page
    emptyPageTitle: 'About HODL HUNT',
    emptyPageDescription:
      'HODL HUNT is a DeFi game on TON where each Dweller is your TON deposit. You keep the Dweller alive by feeding it, hunt smaller Dwellers, and earn from protocol fees and successful hunts.',
    walletStatus: 'Wallet status:',
    connected: 'Wallet connected',
    notConnected: 'Wallet not connected',
    aboutGameTitle: 'About the game',
    aboutGameMenuSubtitle: 'How HODL HUNT works and where the yield comes from',
    aboutGameHeroTitle: 'Big news',
    aboutGameHeroText:
      "Join the top 1% of candidates and get the offer of your dreams with personalized coaching from those who have successfully navigated the path at McKinsey, Goldman Sachs, and Google.",
    aboutGameRulesTitle: 'Game rules',
    aboutGameRulesText:
      "Product design is about one-third of the PM interview process. During the interview, you'll develop a product that solves a problem in a way that makes sense for the company and that users will like.\n\nSome common product design interview questions include:\nWhat's your favorite product and why?\nHow would you improve our product?\nDesign a product for drivers during rush hour.\nHow would you improve Instagram Stories?\nHow would you improve Spotify as a podcast application?\n\nThese questions are centered on your product thinking skills like user empathy and user-centered design, feature prioritization, and changing products for better product-market fit.",
    aboutGameNewsTitle: 'Ocean news',
    aboutGameNewsText:
      "Product design is about one-third of the PM interview process. During the interview, you'll develop a product that solves a problem in a way that makes sense for the company and that users will like.",
    aboutGameTips: [
      'Special tip block. Join the top 1% of candidates and get the offer of your dreams with personalized coaching from those who have successfully navigated the path at McKinsey, Goldman Sachs, and Google.',
      'Special tip block. Join the top 1% of candidates and get the offer of your dreams with personalized coaching from those who have successfully navigated the path at McKinsey, Goldman Sachs, and Google.',
    ],
    aboutGameFaqTitle: 'FAQ',
    aboutGameFaqIntro:
      "Product design is about one-third of the PM interview process. During the interview, you'll develop a product that solves a problem in a way that makes sense for the company and that users will like.",
    aboutGameFaqItems: [
      { question: 'Question 1', answer: 'Sample answer to the question.' },
      { question: 'Question 2', answer: 'Sample answer to the question.' },
      { question: 'Question 3', answer: 'Sample answer to the question.' },
      { question: 'Question 4', answer: 'Sample answer to the question.' },
    ],
    navigationInfo: 'You can use the navigation at the top to switch between pages.',
    pageInfo: 'Page Information',
    menuDisplays: 'Menu is displayed on all pages',
    navigationWorks: 'Navigation works correctly',
    responsiveDesign: 'Responsive design for all devices',
    solanaIntegration: 'Integration with TON Wallet',
    
    // Wallet names
    wallets: {
      phantom: 'Phantom',
      solflare: 'Solflare', 
      torus: 'Torus',
      coinbaseWallet: 'Coinbase Wallet',
      trustWallet: 'Trust Wallet',
      bitKeep: 'BitKeep',
      mathWallet: 'Math Wallet',
      coin98: 'Coin98',
      clover: 'Clover',
      ledger: 'Ledger',
    },
    
    // Languages
    languages: {
      russian: 'Русский',
      english: 'English', 
      chinese: '中文',
    },

    // Tx overlay/modal
    tx: {
      processing: 'Processing transaction...',
      successTitle: 'Transaction completed',
      errorTitle: 'Transaction error',
      actionDone: ' done.',
      actionFailed: ' failed.',
      signature: 'Signature',
      close: 'Close',
    },

    // My fish page actions
    feed: {
      processing: 'Feeding Dweller...',
      actionPrefix: 'Feeding Dweller',
      failed: 'Feed failed',
      minAmountError: 'Minimum deposit is 0.01 TON',
      confirmModal: {
        title: 'Confirm feeding',
        text: [
          { text: 'You are about to feed the Dweller with ' },
          { text: '{amount} TON.', style: { fontWeight: 'bold' } },
          { text: '', style: { display: 'block', marginTop: '8px' } },
          { text: 'After feeding, hunting will be unavailable for ' },
          { text: '48 hours.', style: { fontWeight: 'bold' } },
        ],
        
        confirmLabel: 'Feed',
        cancelLabel: 'Cancel',
      },
    },
    mark: {
      processing: 'Placing mark...',
      actionPrefix: 'Placing mark on Dweller',
      failed: 'Mark placement failed',
      modalTitle: 'Place mark',
      modalDescription: 'You are about to place a hunting mark on the selected Dweller. For a limited time only you will be able to bite this prey.',
      modalConfirm: 'Place mark',
      modalCancel: 'Cancel',
      modalText: [
        { text: '🚨 A tag is the purchase of a priority right to bite.', style: { display: 'block', fontWeight: 'bold' } },
        { text: 'If the Dweller is not fed and becomes prey, only you will be able to bite it during the first 30 minutes.', style: { display: 'block', marginTop: '6px' } },
        { text: 'If the Dweller is fed before the timer expires, the tag cost is not refunded and the tag is burned.', style: { display: 'block', marginTop: '6px' } },
      ],
    },

    // Hint blocks
    hint: {
      label: 'Hint',
      huntTips: [
        'You can place a mark on a Dweller whose hunger timer shows less than 24 hours remaining. If the Dweller is not fed and enters the prey state, you receive a 30-minute exclusive priority window to bite it, during which other players cannot attack it. If the marked Dweller is fed, the mark is burned with no refund.',
        'You can only hunt Dwellers that have less weight than yours. Increase your Dweller’s weight to unlock access to {count} more potential prey.',
      ],
      myDwellersTips: [
        'Half of the fees from other players’ actions are instantly distributed among Dwellers proportionally to their weight. The greater your Dweller’s weight, the larger the share it receives.',
        'Keep an eye on the hunger timer: after feeding, the Dweller is protected from bites for 7 days.',
      ],
    },

    profile: {
      title: 'Profile',
      widgetTitle: 'My profile',
      editModeTitle: 'Enter socials',
      edit: 'Edit',
      myBalance: 'My balance',
      wallet: 'Wallet',
      social: 'Socials',
      dangerOcean: 'Income stats',
      yourIncome: 'Your income',
      ocean: 'Ocean',
      oceanTvl: 'Ocean (TVL)',
      totalIncome: 'Total income',
      oceanTodayTitle: 'Ocean today',
      activeFish: 'Active Dwellers',
      eaten7d: 'Eaten in 7 days',
      redistributed7d: 'Redistributed TON',
    },

    feedButtonLabel: 'Feed',
    hungerIn: 'Hunger in',
    huntButtonLabel: 'Hunt',
    markButtonLabel: 'Place mark',
    markAlreadyPlaced: 'Mark already placed',
    markBurnedLabel: 'Your mark has burned',
    markBurnedText: [
      {text: 'You placed a hunting mark on this Dweller, but its owner fed it before the hunger timer expired.'},
      {text: 'The Dweller never entered the prey state, so your mark was burned.', style: {display: 'block', marginTop: '6px'}}
    ],
    blackMarkExpiresIn: 'Mark expires in',
    myMarkExpiresIn: 'You placed a mark. Expires in',
    biteButtonLabel: 'you will get {amount}',
    biteActionText: 'Bite',
    cooldownTooltipText: 'After creation, feeding, or hunting, a Dweller requires a 48-hour cooldown. Use this time to grow other Dwellers or plan your next hunt.',
    willBeVictimIn: 'Will become victim in',
    victim: 'Victim',
    fishHungry: 'Dweller is hungry',
    deadKilled: 'Killed in the ocean',
    fishFullLabel: 'Dweller is full',
    reviveLabel: 'Revive',
    deadInfo: 'Your Dweller has died and became a victim in the ocean — it was eaten or sold, but you can revive its skin and dive back into the game',

    // Fish page labels (EN)
    myFishBackButton: 'Back',
    myFishBreadcrumb: 'My Dweller',
    huntLabel: 'Hunt',
    analyticsLabel: 'Analytics',
    shareToSocialLabel: 'Share to social',
    dwellerGrowthChart: 'Dweller growth chart',
    shareModal: {
      title: 'Share',
      close: 'Close',
      copyLink: 'Copy link',
      linkCopied: 'Link copied',
    },
    hideFishLabel: 'Hide Dweller',
    hideFishModal: {
      question: 'Hide dead Dweller forever?',
      confirm: 'Hide forever',
      cancel: 'Cancel',
      processing: 'Hiding Dweller...',
    },
    sellFishLabel: 'Sell Dweller',
    redOceanNotice: [
      { text: '🌩 Selling a Dweller is unavailable during an ' },
      { text: 'ocean storm.', style: { fontWeight: 'bold' } },
      { text: '', style: { display: "block", marginTop: '6px' }},
      { text: 'Wait for the mode to change to a ' },
      { text: 'calm ocean', style: { fontWeight: 'bold' } },
      { text: ' to sell your Dweller.' },
    ],
    availableForHuntLabel: 'Available for hunt',
    recentActionsLabel: 'Recent actions',
    growFishButton: 'Grow Dweller',
    over24hLabel: 'in the last 24h',
    freshFishLabel: 'Fresh Dweller',
    totalIncomeLabel: 'Total income:',
    huntIncomeLabel: 'Hunt income:',
    oceanIncomeLabel: 'Ocean income:',
    noSuitablePreyHint: `No suitable Dweller. There are {count} Dwellers heavier than yours. Increase your Dweller to see them.`,

    ocean: {
      happenings: 'What is happening in the ocean',
      yourShare: 'Your share',
      goodHunt: 'Successful hunt',
      newInOcean: 'New in the ocean',
      leftOcean: 'Left the ocean',
      nothingHappened: 'Nothing happened in the ocean',
    },
    eventNames: {
      FishCreated: 'Dweller created',
      FishExited: 'Dweller exited',
      FishFed: 'Dweller fed',
      FishHunted: 'Successful hunt',
      FishResurrected: 'Dweller resurrected',
      FishTransferred: 'Dweller transferred',
      HuntingMarkPlaced: 'Hunting mark placed',
      OceanModeChanged: 'Ocean mode changed',
      Unknown: 'Event',
    },

    // Additional event comments
    fishAtePrey: 'Dweller ate prey',
    fishCreated: 'Dweller created',
    fishExited: 'Left the ocean',
    fishWasHungry: 'Dweller was hungry',

    ranks: {
      rank1: '👑 1st',
      rank2: '🥈 2nd',
      rank3: '🥉 3rd',
    },

    sell: {
      modalConfirmPrefix: 'Sell for',
      modalBody: [
        { text: 'You are about to sell the Dweller.', style: { display: 'block', fontWeight: 'bold', marginBottom: '6px' } },
        { text: 'After the sale, you will receive ' },
        { text: '{amount}', style: { fontWeight: 'bold' } },
        { text: ' in your wallet (the fee is already included).' },
        { text: 'This action is irreversible.', style: { display: 'block', marginTop: '6px' } },
      ],
      modalCancel: 'Cancel',
      processing: 'Selling Dweller...',
      failed: 'Sell failed',
    },

    gift: {
      title: 'Send a gift',
      placeholder: '🔗 Enter wallet address',
      confirm: 'Send gift',
      cancel: 'Cancel',
      processing: 'Sending gift...',
      failed: 'Gift failed',
      invalidAddress: 'Invalid address',
    },
    reviveModal: {
      title: 'Revive Dweller',
      confirm: 'Revive',
      cancel: 'Cancel',
      processing: 'Reviving Dweller...',
      placeholder: 'Enter amount in TON',
      body: 'Enter the amount to revive the Dweller and confirm the action.',
      amountLabel: 'Revive amount',
      amountPlaceholder: '0.00',
      solSuffix: 'TON',
      minAmountError: 'Minimum amount is 0.01 TON'
    },
    noFishYet: 'No Dwellers yet',
    noFishFound: 'No Dwellers found',
    hideDwellersWithMark: 'Hide Dwellers with a mark',
    showPreyFrom: 'Show Dwellers from',
  },
};
