import React, { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { loadRuntimeConfig } from '../config/runtimeConfig';
import { fetchCompat } from '../shared/api/compat';
import { Language, TextToken } from '../locales/translations';
import { Socials } from "../features/fish/components/TopOceanBlock";
import { renderTextToken } from '../helpers/render-text-token';
import { FishActionBiteChildren, FishActionFeedChildren, FishActionModalContent, FishActionSellChildren } from "../features/fish/components/FishActionModal";
import FishHuntCard from "../features/fish/components/FishHuntCard";
import { getApiBaseUrlSync } from '../shared/api/baseUrl';

const apiBaseUrl = getApiBaseUrlSync();

type AboutPageTranslations = {
  heroSection: {
    title: TextToken;
    p1: TextToken;
    p2: TextToken;
    p3: TextToken;
    p4: TextToken;
    p5: TextToken;
    p6: TextToken;
    p7: TextToken;
  }
  earnSection: {
    title: TextToken;
    p1: TextToken;
    p2: TextToken;
    p3: TextToken;
    ul: [
      li1: TextToken,
      li2: TextToken,
      li3: TextToken,
      li4: TextToken,
      li5: TextToken,
      li6: TextToken,
    ];
    p4: TextToken;
    p5: TextToken;
    p6: TextToken;
  }
  createSection: {
    title: TextToken;
    p1: TextToken;
    p2: TextToken;
    ul1: [
      li1: TextToken,
      li2: TextToken,
    ]
    p3: TextToken;
    p4: TextToken;
    p5: TextToken;
    p6: TextToken;
    p7: TextToken;
    ul2: [
      li1: TextToken,
      li2: TextToken,
      li3: TextToken,
      li4: TextToken,
      li5: TextToken,
    ]
    p8: TextToken;
  }
  feedSection: {
    title: TextToken;
    p1: TextToken;
    p2: TextToken;
    methodsSubtitle: TextToken;
    methodP1: TextToken;
    methodList: TextToken[]
    methodP2: TextToken;
    importantSubtitle: TextToken;
    importantList: TextToken[]
    timerSubtitle: TextToken;
    timerP1: TextToken;
    timerList: TextToken[]
    exampleSubitle: TextToken;
    exampleP1: TextToken;
    exampleP2: TextToken;
    exampleP3: TextToken;
    exampleList: TextToken[]
    exampleResult: TextToken;
  }
  huntSection: {
    title: TextToken;
    p1: TextToken;
    p2: TextToken;
    p3: TextToken;
    p4: TextToken;
    ul1: TextToken[];
    p5: TextToken;
    p6: TextToken;
    exampleTitle: TextToken;
    exampleP1: TextToken;
    exampleUl1: TextToken[];
  }

  markSection: {
    title: TextToken;
    intro1: TextToken;
    intro2: TextToken;
    intro3: TextToken;
    intro4: TextToken;
    priorityTitle: TextToken;
    priorityP1: TextToken;
    priorityIntro: TextToken;
    priorityList: TextToken[];
    priorityP2: TextToken;
    note1: TextToken;
    note2: TextToken;
    priceTitle: TextToken;
    priceP1: TextToken;
    priceList: TextToken[];
    distributionTitle: TextToken;
    distributionList: TextToken[];
    riskNote: TextToken;
    finalNote: TextToken;
  };

  oceanSection: {
    title: TextToken;
    intro: TextToken;
    calmTitle: TextToken;
    calmFeeding: TextToken;
    calmExit: TextToken;
    calmRisk: TextToken;
    stormTitle: TextToken;
    stormFeeding: TextToken;
    stormExit: TextToken;
    stormRisk: TextToken;
    durationNote: TextToken;
    changeNote: TextToken;
    probabilityNote: TextToken;
    finalNote: TextToken;
  };

  exitSection: {
    title: TextToken;
    intro: TextToken;
    stormNote: TextToken;
    commissionTitle: TextToken;
    commissionList: TextToken[];
    exampleTitle: TextToken;
    exampleWeight: TextToken;
    examplePlayer: TextToken;
    exampleOther: TextToken;
    exampleAdmins: TextToken;
  };

  extraSection: {
    title: TextToken;
    list: TextToken[];
    simpleIdeaTitle: TextToken;
    simpleIdeaList: TextToken[];
  };

  image1Alt: string;
  image2Alt: string;
  image3Alt: string;
  image4Alt: string;
  image5Alt: string;
  image6Alt: string;
  image7Alt: string;

};

const translation: Record<Language, AboutPageTranslations> = {
  ru: {
    heroSection: {
      title: 'ПЕРЕСТАНЬ БЫТЬ ДОБЫЧЕЙ — СТАНЬ ХИЩИНКОМ',
      p1: [
        { text: 'HODL HUNT', class: "font-bold" }, 
        { text: ' — стратегическая PvP-игра c TON-платежами, где игровая логика работает через backend и базу данных.' }
      ],
      p2: 'Ты создаёшь морского жителя с желаемым весом в TON и управляешь его жизнью.',
      p3: [
        { text: 'Всё, что нужно, чтобы не потерять жителя — кормить его один раз в 7 дней.', class: "font-bold" },
      ],
      p4: 'Если жителя не покормили по истечении таймера голода, он переходит в статус жертвы и становится доступен для охоты.',
      p5: 'Ты можешь охотиться на жителей других игроков, которые не покормили их вовремя, и забирать их TON себе.',
      p6: 'Игровые правила и лимиты централизованно публикуются backend-сервисом и применяются единообразно для всех игроков.',
      p7: 'Создатели HODL HUNT не имеют доступа к средствам и не могут вмешиваться в процесс.',
    },
    earnSection: {
      title: '💸 Как распределяется TON в HODL HUNT',
      p1: 'В HODL HUNT нет токенов, эмиссии и «наград от системы».',
      p2: 'Экономика TON в игре строится на действиях игроков, а перераспределение рассчитывается сервером и фиксируется в базе данных.',
      p3: [
        { text: 'Игрок получает TON из ' },
        { text: 'шести источников:', class: "font-bold" },
      ],
      ul: [
        [
          { text: 'С новых игроков', class: "font-bold" },
          { text: ' — комиссия за вход в игру распределяется между текущими жителями.' },
        ],
        [
          { text: 'С кормления других игроков', class: "font-bold" },
          { text: ' — часть каждой порции кормления распределяется между жителями океана.' },
        ],
        [
          { text: 'С охоты других игроков', class: "font-bold" },
          { text: ' — при уничтожении жертвы часть её веса распределяется оставшимся жителям.' },
        ],
        [
          { text: 'С покупки охотничьих меток', class: "font-bold" },
          { text: ' — часть средства с меток распределяются между жителями.' },
        ],
        [
          { text: 'С выхода игроков', class: "font-bold" },
          { text: ' — покидая игру (продажа жителя), игроки оставляют часть веса в системе.' },
        ],
        [
          { text: 'Со своей собственной охоты', class: "font-bold" },
          { text: ' — охотясь на жертв, игрок напрямую забирает их TON.' },
        ],
      ],
      p4: 'Выплаты и начисления проводятся backend-сервисом после подтверждённых действий пользователя.',
      p5: 'Никаких токенов, надстроек и инфляции.',
      p6: [
        { text: '50% всех комиссий игры распределяется между жителями океана и начисляется пропорционально их весу.', class: "font-bold" },
      ],
    },
    createSection: {
      title: '🐟 Создание жителя',
      p1: [
        { text: 'Игрок создаёт жителя на любую сумму от '},
        { text: '0.01 TON', class: "font-bold" },
        { text: '.' },
      ],
      p2: [
        { text: 'Сверху удерживается комиссия '},
        { text: '10%:', class: "font-bold" },
      ],
      ul1: [
        [
          { text: '5% → админам', class: "font-bold" },
          { text: ' (маркетинг, развитие)' },
        ], 
        [
          { text: '5% → другим жителям', class: "font-bold" },
          { text: ' (пропорционально весу жителя)' },
        ],
      ],
      p3: [
        { text: 'Аватар жителя подбирается случайным образом.', class: "font-bold" },
      ],
      p4: 'Игрок не может выбрать или изменить внешний вид жителя.',
      p5: 'После создания действует кулдаун  на охоту 48 часов — житель не может охотиться в этот период.',
      p6: 'Пример:',
      p7: [
        { text: 'Игрок создаёт жителя за '},
        { text: '1 TON', style: { fontWeight: 'bold' } },
      ],
      ul2: [
        [
          { text: 'платит '},
          { text: '1.10 TON', class: "font-bold" },
        ],
        [
          { text: 'комиссия '},
          { text: '0.10 TON', class: "font-bold" },
        ],
        [
          { text: '0.05 TON', class: "font-bold" },
          { text: ' распределяется другим жителям' },
        ],
        [
          { text: '0.05 TON', class: "font-bold" },
          { text: ' — админам' },
        ],
        [
          { text: 'житель появляется в океане с весом '},
          { text: '1 TON', class: "font-bold" },
        ],
      ],
      p8: [
        { text: 'Бонус:', class: "font-bold" },
        { text: ' после создания житель '},
        { text: 'считается покормленным на следующие 7 дней', class: "font-bold" },
        { text: ' — недоступен для укуса.'},
      ],
    },
    feedSection: {
      title: '🍽 Кормление',
      p1: [
        {text: 'Каждому морскому жителю необходимо '},
        {text: 'раз в 7 дней', class: "font-bold" },
        {text: ' закрывать норму кормления.'},
      ],
      p2: 'Если норма не закрыта, житель становится жертвой и доступен для охоты другим игрокам.',
      methodsSubtitle: 'Способы кормления',
      methodP1: [
        { text: 'Закрыть норму кормления можно ' },
        { text: 'двумя способами:', class: "font-bold" },
      ],
      methodList: [
        [
          { text: 'Покормить напрямую', class: "font-bold" },
          { text: ' — внести TON в порцию кормления' },
        ],
        [
          { text: 'Покормиться через охоту', class: "font-bold" },
          { text: ' — если при охоте на другого жителя полученная добыча равна или превышает текущую норму кормления, житель автоматически считается покормленным' },
        ],
      ],
      methodP2: [
        { text: 'Охота в этом случае ' },
        { text: 'полностью заменяет кормление', class: "font-bold" },
        { text: ' и запускает новый 7-дневный цикл.' },
      ],
      importantSubtitle: 'Важно',
      importantList: [
        [
          { text: 'Вся сумма кормления добавляется к весу вашего жителя.', class: 'font-bold' },
        ],
        [
          { text: 'Это не донат и не комиссия — деньги не уходят «в игру», а увеличивают вес вашего жителя.' },
        ],
        [
          { text: 'Размер порции кормления зависит от режима океана и составляет ', class: 'font-bold' },
          { text: '5% или 10% от веса жителя.', class: 'font-bold' },
        ],
        [
          { text: 'Норму кормления можно закрывать ', class: 'font-bold' },
          { text: 'частями в разные дни', class: 'font-bold' },
          { text: ', пока не будет набрана полная порция.' },
        ],
        [
          { text: 'Как только норма кормления за 7 дней полностью закрыта, таймер голода сбрасывается и начинается ', class: 'font-bold' },
          { text: 'новый 7-дневный отсчёт.', class: 'font-bold' },
        ],
        [
          { text: 'После любого кормления', class: 'font-bold' },
          { text: ' (напрямую или через охоту) действует '},
          { text: 'кулдаун 48 часов', class: 'font-bold' },
          { text: ', в течение которого житель не может охотиться.' },
        ],
      ],
      timerSubtitle: 'Таймер голода',
      timerP1: 'В профиле каждого жителя отображается таймер голода, где видно:',
      timerList: [
        'сколько процентов нормы кормления уже набрано',
        'сколько осталось до полной порции',
        'сколько времени осталось до перехода в статус жертвы',
      ],
      exampleSubitle: 'Пример:',
      exampleP1: [
        {text: 'Житель весит '},
        {text: '1.00 TON.', class: 'font-bold'},
      ],
      exampleP2: [{text: 'Сегодня процент кормления — '},
        {text: '5%.', class: 'font-bold'},
      ],
      exampleP3: 'Игрок кормит жителя:',
      exampleList: [
        [
          { text: 'платит ' },
          { text: '0.055 TON', class: 'font-bold' },
        ],
        [
          { text: '0.05 TON ', class: 'font-bold' },
          { text: 'добавляется к весу жителя' },
        ],
        [
          { text: '0.0025 TON', class: 'font-bold' },
          { text: ' получают другие жители' },
        ],
        [
          { text: '0.0025 TON', class: 'font-bold' },
          { text: ' получают админы' },
        ],
      ],
      exampleResult: [{text: 'Вес жителя становится '},
        {text: '1.05 TON', class: 'font-bold'},
        {text: ', а таймер голода сбрасывается, и начинается '},
        {text: 'новый 7-дневный отсчёт до голода.', class: 'font-bold'},
        {text: ''},
      ],
    },
    huntSection: {
      title: '🦈 Охота',
      p1: [
        {text: 'Охотиться можно '},
        {text: 'только на жителей', class: "font-bold"},
        {text: ', находящихся в статусе жертвы и имеющих '},
        {text: 'вес меньше', class: "font-bold"},
        {text: ', чем у вашего жителя.'},
      ],
      p2: [
        {text: 'Если твой житель весит '},
        {text: '1 TON', class: "font-bold"},
        {text: ', ты можешь охотиться только на жителей с весом '},
        {text: 'меньше 1 TON', class: "font-bold"},
        {text: '.'},
      ],
      p3: [{text:'Укус всегда смертельный.', class: "font-bold"}],
      p4: 'Он уничтожает жителя-жертву и распределяет его вес следующим образом:',
      ul1: [
        [
          { text: '80%', class: "font-bold" },
          { text: ' → охотнику' },
        ],
        [
          { text: '10%', class: "font-bold" },
          { text: ' → другим рыбам' },
        ],
        [
          { text: '10%', class: "font-bold" },
          { text: ' → админам' },
        ],
      ],
      p5: [
        {text: 'Успешная охота также считается кормлением', class: "font-bold block"},
        {text: ' и запускает новый '},
        {text: '7-дневный цикл жизни жителя.', class: "font-bold"},
      ],
      p6: [
        {text: 'После охоты действует '},
        {text: 'кулдаун 48 часов', class: "font-bold"},
        {text: ' — в этот период житель '},
        {text: 'не может охотиться', class: "font-bold"},
        {text: '.'},
      ],
      exampleTitle: 'Пример:',
      exampleP1: [
        {text: 'Жертва весит '},
        {text: '1.00 TON', class: "font-bold"},
        {text: ':'}
      ],
      exampleUl1: [
        [{text: '0.80 TON', class: 'font-bold'},
          {text: ' получает охотник'},
        ],
        [{text: '0.10 TON', class: 'font-bold'},
          {text: ' распределяется другим жителям'},
        ],
        [{text: '0.10 TON', class: 'font-bold'},
          {text: ' — админам'},
        ],
      ],
    },

    markSection: {
      title: '🎯 Охотничьи метки',
      intro1: 'На жителей, близких к голоду, можно ставить охотничьи метки.',
      intro2: [
        { text: 'Цена метки ' },
        { text: 'динамическая', class: "font-bold" },
        { text: ' и зависит от времени до перехода жителя в статус жертвы.' },
      ],
      intro3: [
        { text: 'Если житель ' },
        { text: 'не покормился', class: "font-bold" },
        { text: ', охотник, поставивший метку, получает ' },
        { text: 'приоритетное окно для укуса.', class: "font-bold" },
      ],
      intro4: [
        { text: 'Если житель ' },
        { text: 'покормился', class: "font-bold" },
        { text: ', метка сгорает — средства не возвращаются.' },
      ],
      priorityTitle: 'Приоритетное окно',
      priorityP1: [
        { text: 'После перехода жителя в статус жертвы охотник, поставивший метку, получает ' },
        { text: 'эксклюзивное окно 30 минут для укуса.', class: "font-bold" },
      ],
      priorityIntro: 'В течение этих 30 минут:',
      priorityList: [
        'только охотник с меткой может укусить жертву',
        'другие жители не имеют доступа к охоте на неё',
      ],
      priorityP2: [
        { text: 'Если охотник ' },
        { text: 'не успел укусить', class: "font-bold" },
        { text: ' жертву в течение 30 минут, она становится доступной для охоты ' },
        { text: 'всем остальным игрокам.', class: "font-bold" },
      ],
      note1: [
        { text: 'На одного жителя может быть установлена только одна охотничья метка одновременно.', class: "font-bold" },
      ],
      note2: 'Пока метка активна, другие охотники не могут поставить метку на этого жителя.',
      priceTitle: 'Стоимость метки:',
      priceP1: [
        { text: 'Стоимость метки всегда рассчитывается ' },
        { text: 'от веса жертвы.', class: "font-bold" },
      ],
      priceList: [
        [
          { text: 'Метка за ' },
          { text: '24 часа', class: "font-bold" },
          { text: ' до голода жертвы стоит ' },
          { text: '5%', class: "font-bold" },
          { text: ' от веса жертвы' },
        ],
        [
          { text: 'Метка за ' },
          { text: '3 часа', class: "font-bold" },
          { text: ' до голода жертвы стоит ' },
          { text: '10%', class: "font-bold" },
          { text: ' от веса жертвы' },
        ],
      ],
      distributionTitle: 'Распределение средств с метки:',
      distributionList: [
        [
          { text: '50%', class: "font-bold" },
          { text: ' → другим жителям' },
        ],
        [
          { text: '50%', class: "font-bold" },
          { text: ' → админам' },
        ],
      ],
      riskNote: [
        { text: 'Охотничья метка никак не влияет на условия для жителя, на которого она поставлена.', class: "font-bold" },
        { text: ' Для владельца жителя правила не меняются: если житель будет покормлен вовремя, он не станет жертвой, независимо от наличия метки.' },
      ],
      finalNote: [
        { text: 'Метка — это покупка риска, а не гарантия укуса.', class: "font-bold" },
      ],
    },

    oceanSection: {
      title: '🌊 Состояния океана',
      intro: [
        { text: 'Океан всегда находится ' },
        { text: 'в одном из двух состояний', class: "font-bold" },
        { text: ', которые напрямую влияют на кормление, выход из игры и уровень риска.' },
      ],
      calmTitle: '🔹 Режим спокойствия',
      calmFeeding: [
        { text: 'Процент кормления — ' },
        { text: '5%.', class: "font-bold" },
      ],
      calmExit: 'Из игры можно выйти.',
      calmRisk: 'Низкий риск, контроль ситуации.',
      stormTitle: '🔸 Режим шторма',
      stormFeeding: [
        { text: 'Процент кормления — ' },
        { text: '10%.', class: "font-bold" },
      ],
      stormExit: 'Выход из игры недоступен.',
      stormRisk: 'Давление, ошибки, появление жертв.',
      durationNote: [
        { text: 'Выбранный режим действует ' },
        { text: '24 часа', class: "font-bold" },
        { text: ' и применяется ' },
        { text: 'ко всем жителям океана одновременно.', class: "font-bold" },
      ],
      changeNote: [
        { text: 'Режим океана ' },
        { text: 'меняется каждый день в 00:00 (UTC)', class: "font-bold" },
        { text: ' случайным образом.' },
      ],
      probabilityNote: [
        { text: 'Вероятность выпадения шторма — ' },
        { text: '35%.', class: "font-bold" },
      ],
      finalNote: [
        { text: 'Это вынуждает игроков', class: "font-bold" },
        { text: ' держать запас TON, планировать действия заранее и принимать риск.' },
      ],
    },

    exitSection: {
      title: '🚪 Выход из игры',
      intro: [
        { text: 'Игрок может уничтожить жителя, забрать его TON и выйти из игры ' },
        { text: 'в любой момент', class: "font-bold" },
        { text: ', если океан находится ' },
        { text: 'в режиме спокойного океана.', class: "font-bold" },
      ],
      stormNote: [
        { text: 'В режиме шторма в океане', class: "font-bold" },
        { text: ' выход из игры ' },
        { text: 'временно недоступен', class: "font-bold" },
        { text: ', нужно дождаться смены режима на спокойный океан, который ' },
        { text: 'меняется каждый день в 00:00 (UTC)', class: "font-bold" },
        { text: ' и определяется случайным образом.' },
      ],
      commissionTitle: [
        { text: 'Комиссия выхода составляет ' },
        { text: '10%:', class: "font-bold" },
      ],
      commissionList: [
        [
          { text: '5%', class: "font-bold" },
          { text: ' → другим игрокам' },
        ],
        [
          { text: '5%', class: "font-bold" },
          { text: ' → админам' },
        ],
      ],
      exampleTitle: 'Пример:',
      exampleWeight: [
        { text: 'Житель весит ' },
        { text: '2.00 TON', class: "font-bold" },
      ],
      examplePlayer: [
        { text: '→ игрок получает ' },
        { text: '1.80 TON', class: "font-bold" },
      ],
      exampleOther: [
        { text: '→ ' },
        { text: '0.10 TON', class: "font-bold" },
        { text: ' — другим жителям' },
      ],
      exampleAdmins: [
        { text: '→ ' },
        { text: '0.10 TON', class: "font-bold" },
        { text: ' — админам (маркетинг, развитие)' },
      ],
    },

    extraSection: {
      title: '📌 Дополнительно',
      list: [
        [
          { text: 'Минимальный вес жителя и операций — ' },
          { text: '0.01 TON', class: "font-bold" },
        ],
        'Жителей можно передавать между аккаунтами',
        [
          { text: 'Игрок может создавать ' },
          { text: 'неограниченное количество ', class: "font-bold" },
          { text: 'жителей' },
        ],
        [
          { text: 'Все действия происходят ' },
          { text: 'через подтверждение пользователя + backend-обработку', class: "font-bold" },
        ],
        [
          { text: 'Контракт ' },
          { text: 'без админ-доступа', class: "font-bold" },
        ],
        [
          { text: 'Код открыт и проходил ' },
          { text: 'внешний аудит', class: "font-bold" },
        ],
      ],
      simpleIdeaTitle: 'Простая идея',
      simpleIdeaList: [
        'Создай морского жителя.',
        'Корми или охоться.',
        'Ошибся — тебя съели.',
      ],
    },

    image1Alt: 'Морской житель в океане HODL HUNT',
    image2Alt: 'Схема распределения дохода между жителями океана',
    image3Alt: 'Создание нового жителя в океане',
    image4Alt: 'Процесс кормления жителя',
    image5Alt: 'Охота на жертву в океане',
    image6Alt: 'Интерфейс состояния океана',
    image7Alt: 'Графика режима шторма и спокойствия',

  },
  en: {
    heroSection: {
      title: 'STOP BEING PREY — BECOME A PREDATOR',
      p1: [
        { text: 'HODL HUNT', style: { fontWeight: 'bold' } },
        { text: ' — a strategic PvP game with TON payments where gameplay is server-driven and backed by a database.' }
      ],
      p2: 'You create a Sea Dweller with a chosen weight in TON and manage its life cycle.',
      p3: 'All you need to do to keep your Dweller safe is to feed it once every 7 days.',
      p4: 'If a Dweller is not fed before the hunger timer expires, it enters the prey state and becomes available for hunting.',
      p5: 'You can hunt Dwellers of other players who failed to feed them in time and claim their TON.',
      p6: 'Game rules and limits are published by backend services and applied consistently for all players.',
      p7: 'The creators of HODL HUNT have no access to player funds and cannot interfere with the process.',
    },

    earnSection: {
      title: '💸 How TON is distributed in HODL HUNT',
      p1: 'HODL HUNT has no tokens, no emissions, and no “system rewards.”',
      p2: 'The TON economy is player-driven, while redistribution is calculated by backend services and stored in the database.',
      p3: [
        { text: 'Players receive TON from ' },
        { text: 'six sources:', style: { fontWeight: 'bold' } },
      ],
      ul: [
        [
          { text: 'New players', style: { fontWeight: 'bold' } },
          { text: ' — the entry fee is distributed among existing Dwellers.' },
        ],
        [
          { text: 'Other players’ feeding', style: { fontWeight: 'bold' } },
          { text: ' — part of every feeding portion is distributed among Ocean Dwellers.' },
        ],
        [
          { text: 'Other players’ hunts', style: { fontWeight: 'bold' } },
          { text: ' — when a prey is destroyed, part of its weight is redistributed among remaining Dwellers.' },
        ],
        [
          { text: 'Hunting tag purchases', style: { fontWeight: 'bold' } },
          { text: ' — part of the tag cost is distributed among Dwellers.' },
        ],
        [
          { text: 'Player exits', style: { fontWeight: 'bold' } },
          { text: ' — when leaving the game (selling a Dweller), players leave part of their weight in the system.' },
        ],
        [
          { text: 'Your own hunts', style: { fontWeight: 'bold' } },
          { text: ' — by hunting prey, you directly claim their TON.' },
        ],
      ],
      p4: 'Payouts and accruals are executed by backend services after user-confirmed actions.',
      p5: 'No tokens, no layers, no inflation.',
      p6: '50% of all game fees are distributed among Ocean Dwellers proportionally to their weight.',
    },

    createSection: {
      title: '🐟 Creating a Dweller',
      p1: [
        { text: 'A player can create a Dweller with any amount starting from ' },
        { text: '0.01 TON.', style: { fontWeight: 'bold' } },
      ],
      p2: [
        { text: 'A fee of ' },
        { text: '10% is charged on top:', style: { fontWeight: 'bold' } },
      ],
      ul1: [
        [
          { text: '5% → admins', style: { fontWeight: 'bold' } },
          { text: ' (marketing, development)' },
        ],
        [
          { text: '5% → other Dwellers', style: { fontWeight: 'bold' } },
          { text: ' (distributed proportionally by weight)' },
        ],
      ],
      p3: 'The Dweller avatar is assigned randomly.',
      p4: 'The player cannot choose or change the Dweller’s appearance.',
      p5: 'After creation, a 48-hour hunting cooldown applies — the Dweller cannot hunt during this period.',
      p6: 'Example:',
      p7: [
        { text: 'A player creates a Dweller with ' },
        { text: '1 TON', style: { fontWeight: 'bold' } },
      ],
      ul2: [
        [
          { text: 'Pays ' },
          { text: '1.10 TON', style: { fontWeight: 'bold' } },
        ],
        [
          { text: 'Fee: ' },
          { text: '0.10 TON', style: { fontWeight: 'bold' } },
        ],
        [
          { text: '0.05 TON', style: { fontWeight: 'bold' } },
          { text: ' is distributed to other Dwellers' },
        ],
        [
          { text: '0.05 TON', style: { fontWeight: 'bold' } },
          { text: ' goes to admins', style: { fontWeight: 'bold' } },
        ],
        [
          { text: 'The Dweller enters the ocean with a weight of ' },
          { text: '1 TON', style: { fontWeight: 'bold' } },
        ],
      ],
      p8: [
        { text: 'Bonus:', style: { fontWeight: 'bold' } },
        { text: ' after creation, the Dweller ' },
        { text: 'is considered fed for the next 7 days', style: { fontWeight: 'bold' } },
        { text: ' and cannot be bitten.' },
      ],
    },

    feedSection: {
      title: '🍽 Feeding',
      p1: [
        { text: 'Every Sea Dweller must ' },
        { text: 'meet its feeding requirement once every 7 days', class: 'font-bold' },
        { text: '.' },
      ],
      p2: 'If the requirement is not met, the Dweller becomes prey and can be hunted by other players.',
      methodsSubtitle: 'Feeding methods',
      methodP1: [
        { text: 'The feeding requirement can be met in ' },
        { text: 'two ways:', class: 'font-bold' },
      ],
      methodList: [
        [
          { text: 'Direct feeding' },
          { text: ' — add TON directly to the feeding portion', class: 'font-bold' },
        ],
        [
          { text: 'Feeding through hunting' },
          { text: ' — if the loot from a hunt equals or exceeds the current feeding requirement, the Dweller is automatically considered fed', class: 'font-bold' },
        ],
      ],
      methodP2: [
        { text: 'In this case, hunting ' },
        { text: 'fully replaces feeding' },
        { text: ' and starts a new 7-day cycle.' },
      ],
      importantSubtitle: 'Important',
      importantList: [
        [
          { text: 'The full feeding amount is added to your Dweller’s weight.', class: 'font-bold block' },
          { text: 'This is not a donation or a fee — the TON does not go “to the game” but increases your Dweller’s weight.' },
        ],
        [
          { text: 'The feeding portion depends on the ocean mode and equals ' },
          { text: '5% or 10% of the Dweller’s weight.', class: 'font-bold' },
        ],
        [
          { text: 'The feeding requirement can be fulfilled ' },
          { text: 'in parts over multiple days', class: 'font-bold' },
          { text: ', until the full portion is reached.' },
        ],
        [
          { text: 'Once the 7-day feeding requirement is fully met, the hunger timer resets and a ' },
          { text: 'new 7-day countdown begins.', class: 'font-bold' },
        ],
        [
          { text: 'After any feeding', class: 'font-bold' },
          { text: ' (direct or via hunting), a ' },
          { text: '48-hour cooldown applies', class: 'font-bold' },
          { text: ', during which the Dweller cannot hunt.' },
        ],
      ],
      timerSubtitle: 'Hunger timer',
      timerP1: 'Each Dweller profile displays a hunger timer showing:',
      timerList: [
        'how much of the feeding requirement has already been met',
        'how much remains until the full portion',
        'how much time is left before entering the prey state',
      ],
      exampleSubitle: 'Example:',
      exampleP1: [
        { text: 'The Dweller weighs ' },
        { text: '1.00 TON.', class: 'font-bold' },
      ],
      exampleP2: [
        { text: 'Today’s feeding rate is ' },
        { text: '5%.', class: 'font-bold' },
      ],
      exampleP3: 'The player feeds the Dweller:',
      exampleList: [
        [
          { text: 'Pays ' },
          { text: '0.055 TON', class: 'font-bold' },
        ],
        [
          { text: '0.05 TON', class: 'font-bold' },
          { text: ' is added to the Dweller’s weight' },
        ],
        [
          { text: '0.0025 TON', class: 'font-bold' },
          { text: ' is distributed to other Dwellers' },
        ],
        [
          { text: '0.0025 TON', class: 'font-bold' },
          { text: ' goes to admins' },
        ],
      ],
      exampleResult: [
        { text: 'The Dweller’s weight becomes ' },
        { text: '1.05 TON', class: 'font-bold' },
        { text: ', the hunger timer resets, and a ' },
        { text: 'new 7-day countdown begins.', class: 'font-bold' },
      ],
    },

    huntSection: {
      title: '🦈 Hunting',
      p1: [
        { text: 'You can hunt ' },
        { text: 'only Dwellers', class: 'font-bold' },
        { text: ' that are in the prey state and have ' },
        { text: 'less weight', class: 'font-bold' },
        { text: ' than your Dweller.' },
      ],
      p2: [
        { text: 'If your Dweller weighs ' },
        { text: '1 TON', class: 'font-bold' },
        { text: ', you can only hunt Dwellers with a weight ' },
        { text: 'below 1 TON', class: 'font-bold' },
        { text: '.' },
      ],
      p3: [{ text: 'A bite is always lethal.', class: 'font-bold' }],
      p4: 'It destroys the prey Dweller and redistributes its weight as follows:',
      ul1: [
        '80% → the hunter',
        '10% → other Dwellers',
        '10% → admins',
      ],
      p5: [
        { text: 'A successful hunt also counts as feeding', class: 'font-bold block' },
        { text: ' and starts a new ' },
        { text: '7-day life cycle.', class: 'font-bold' },
      ],
      p6: [
        { text: 'After hunting, a ' },
        { text: '48-hour cooldown applies', class: 'font-bold' },
        { text: ' — during this period, the Dweller ' },
        { text: 'cannot hunt.', class: 'font-bold' },
      ],
      exampleTitle: 'Example:',
      exampleP1: [
        { text: 'The prey weighs ' },
        { text: '1.00 TON', class: 'font-bold' },
        { text: ':' },
      ],
      exampleUl1: [
        [
          { text: '0.80 TON', class: 'font-bold' },
          { text: ' goes to the hunter' },
        ],
        [
          { text: '0.10 TON', class: 'font-bold' },
          { text: ' is distributed among other Dwellers' },
        ],
        [
          { text: '0.10 TON', class: 'font-bold' },
          { text: ' goes to admins' },
        ],
      ],
    },

    markSection: {
      title: '🎯 Hunting marks',
      intro1: 'You can place hunting marks on Dwellers that are close to hunger.',
      intro2: [
        { text: 'The mark price is ' },
        { text: 'dynamic', class: "font-bold" },
        { text: ' and depends on the time left before the Dweller turns into a victim.' },
      ],
      intro3: [
        { text: 'If the Dweller is ' },
        { text: 'not fed', class: "font-bold" },
        { text: ', the hunter who placed the mark gets a ' },
        { text: 'priority window to bite.', class: "font-bold" },
      ],
      intro4: [
        { text: 'If the Dweller is ' },
        { text: 'fed', class: "font-bold" },
        { text: ', the mark burns — funds are not refunded.' },
      ],
      priorityTitle: 'Priority window',
      priorityP1: [
        { text: 'After the Dweller turns into a victim, the hunter who placed the mark gets an ' },
        { text: 'exclusive 30-minute window to bite.', class: "font-bold" },
      ],
      priorityIntro: 'During these 30 minutes:',
      priorityList: [
        'only the hunter with the mark can bite the victim',
        'other Dwellers do not have access to hunt it',
      ],
      priorityP2: [
        { text: 'If the hunter ' },
        { text: 'fails to bite', class: "font-bold" },
        { text: ' the victim within 30 minutes, it becomes available for hunting to ' },
        { text: 'all other players.', class: "font-bold" },
      ],
      note1: [
        { text: 'Only one hunting mark can be placed on a Dweller at a time.', class: "font-bold" },
      ],
      note2: 'While the mark is active, other hunters cannot place a mark on this Dweller.',
      priceTitle: 'Mark cost:',
      priceP1: [
        { text: 'The mark cost is always calculated ' },
        { text: 'from the victim\'s weight.', class: "font-bold" },
      ],
      priceList: [
        [
          { text: 'A mark ' },
          { text: '24 hours', class: "font-bold" },
          { text: ' before the victim\'s hunger costs ' },
          { text: '5%', class: "font-bold" },
          { text: ' of the victim\'s weight' },
        ],
        [
          { text: 'A mark ' },
          { text: '3 hours', class: "font-bold" },
          { text: ' before the victim\'s hunger costs ' },
          { text: '10%', class: "font-bold" },
          { text: ' of the victim\'s weight' },
        ],
      ],
      distributionTitle: 'Funds from the mark are distributed:',
      distributionList: [
        [
          { text: '50%', class: "font-bold" },
          { text: ' → to other Dwellers' },
        ],
        [
          { text: '50%', class: "font-bold" },
          { text: ' → to admins' },
        ],
      ],
      riskNote: [
        { text: 'A hunting mark does not affect the conditions for the Dweller it is placed on.', class: "font-bold" },
        { text: ' For the Dweller owner, the rules do not change: if the Dweller is fed on time, it will not become a victim, regardless of the mark.' },
      ],
      finalNote: [
        { text: 'A mark is a purchase of risk, not a guarantee of a bite.', class: "font-bold" },
      ],
    },

    oceanSection: {
      title: '🌊 Ocean states',
      intro: [
        { text: 'The ocean is always in ' },
        { text: 'one of two states', class: "font-bold" },
        { text: ', which directly affect feeding, game exit, and risk level.' },
      ],
      calmTitle: '🔹 Calm mode',
      calmFeeding: [
        { text: 'Feeding rate is ' },
        { text: '5%.', class: "font-bold" },
      ],
      calmExit: 'You can exit the game.',
      calmRisk: 'Low risk, full control.',
      stormTitle: '🔸 Storm mode',
      stormFeeding: [
        { text: 'Feeding rate is ' },
        { text: '10%.', class: "font-bold" },
      ],
      stormExit: 'Exit from the game is disabled.',
      stormRisk: 'Pressure, mistakes, new victims appear.',
      durationNote: [
        { text: 'The selected mode lasts for ' },
        { text: '24 hours', class: "font-bold" },
        { text: ' and applies to ' },
        { text: 'all ocean Dwellers simultaneously.', class: "font-bold" },
      ],
      changeNote: [
        { text: 'The ocean mode ' },
        { text: 'changes every day at 00:00 (UTC)', class: "font-bold" },
        { text: ' randomly.' },
      ],
      probabilityNote: [
        { text: 'The probability of a storm is ' },
        { text: '35%.', class: "font-bold" },
      ],
      finalNote: [
        { text: 'This forces players', class: "font-bold" },
        { text: ' to keep a TON reserve, plan ahead and take risks.' },
      ],
    },

    exitSection: {
      title: '🚪 Exit from the game',
      intro: [
        { text: 'A player can destroy a Dweller, withdraw their TON and leave the game ' },
        { text: 'at any time', class: "font-bold" },
        { text: ', if the ocean is in ' },
        { text: 'calm ocean mode.', class: "font-bold" },
      ],
      stormNote: [
        { text: 'In storm mode in the ocean', class: "font-bold" },
        { text: ' exit from the game is ' },
        { text: 'temporarily unavailable', class: "font-bold" },
        { text: ', you need to wait for the mode to change to calm ocean, which ' },
        { text: 'changes every day at 00:00 (UTC)', class: "font-bold" },
        { text: ' and is determined randomly.' },
      ],
      commissionTitle: [
        { text: 'Exit fee is ' },
        { text: '10%:', class: "font-bold" },
      ],
      commissionList: [
        [
          { text: '5%', class: "font-bold" },
          { text: ' → to other players' },
        ],
        [
          { text: '5%', class: "font-bold" },
          { text: ' → to admins' },
        ],
      ],
      exampleTitle: 'Example:',
      exampleWeight: [
        { text: 'The Dweller weighs ' },
        { text: '2.00 TON', class: "font-bold" },
      ],
      examplePlayer: [
        { text: '→ the player receives ' },
        { text: '1.80 TON', class: "font-bold" },
      ],
      exampleOther: [
        { text: '→ ' },
        { text: '0.10 TON', class: "font-bold" },
        { text: ' — to other Dwellers' },
      ],
      exampleAdmins: [
        { text: '→ ' },
        { text: '0.10 TON', class: "font-bold" },
        { text: ' — to admins (marketing, development)' },
      ],
    },

    extraSection: {
      title: '📌 Additionally',
      list: [
        [
          { text: 'Minimum Dweller weight and operations — ' },
          { text: '0.01 TON', class: "font-bold" },
        ],
        'Dwellers can be transferred between accounts',
        [
          { text: 'A player can create an ' },
          { text: 'unlimited number ', class: "font-bold" },
          { text: 'of Dwellers' },
        ],
        [
          { text: 'All actions occur ' },
          { text: 'through user confirmation and backend settlement', class: "font-bold" },
        ],
        [
          { text: 'Contract ' },
          { text: 'without admin access', class: "font-bold" },
        ],
        [
          { text: 'Code is open and has undergone ' },
          { text: 'external audit', class: "font-bold" },
        ],
      ],
      simpleIdeaTitle: 'Simple idea',
      simpleIdeaList: [
        'Create a sea Dweller.',
        'Feed or hunt.',
        'Made a mistake — you got eaten.',
      ],
    },

    image1Alt: 'Sea creature in the HODL HUNT ocean',
    image2Alt: 'Diagram of how income is distributed among ocean Dwellers',
    image3Alt: 'Creating a new Dweller in the ocean',
    image4Alt: 'Feeding process of a Dweller',
    image5Alt: 'Hunting a victim in the ocean',
    image6Alt: 'Ocean state interface',
    image7Alt: 'Graphic of storm and calm ocean modes',

  },
};

type WidgetItem = {
  id: string;
  name: string;
  valueText: string;
  walletAddress: string;
  owner?: string;
  avatarUrl?: string | null;
  avatarType?: 'jellyfish' | 'shark' | 'fish' | 'whale' | 'octopus';
  socials?: { x?: string; telegram?: string; discord?: string };
};

const RecentlyInOceanWidget: React.FC = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'new' | 'top'>('new');
  const [recentItems, setRecentItems] = useState<WidgetItem[]>([]);
  const [topItems, setTopItems] = useState<WidgetItem[]>([]);
  const [loadingRecent, setLoadingRecent] = useState<boolean>(true);
  const [loadingTop, setLoadingTop] = useState<boolean>(true);

  const getAvatarGradient = (type: string) => {
    const gradients = {
      jellyfish: 'bg-gradient-to-br from-purple-400 to-pink-400',
      shark: 'bg-gradient-to-br from-blue-400 to-cyan-400',
      fish: 'bg-gradient-to-br from-green-400 to-teal-400',
      whale: 'bg-gradient-to-br from-indigo-400 to-purple-400',
      octopus: 'bg-gradient-to-br from-orange-400 to-red-400',
    };
    return gradients[type as keyof typeof gradients] || gradients.fish;
  };

  const shortAddr = (addr?: string) => {
    if (!addr) return '';
    const s = String(addr);
    return `${s.slice(0, 6)}...${s.slice(-4)}`;
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoadingRecent(true);
        setLoadingTop(true);
        const { API_BASE_URL } = await loadRuntimeConfig();
        const base = (API_BASE_URL || '').replace(/\/$/, '');

        const recentP = (async () => {
          try {
            const r = await fetchCompat(base, '/api/v1/events?type=FishCreated&limit=10');
            if (!r.ok) throw new Error('bad');
            const j = await r.json();
            const evs: any[] = Array.isArray(j?.data) ? j.data : Array.isArray(j?.items) ? j.items : [];
            const rows = evs
              .map((e: any) => {
                const pd = e?.payloadDec || {};
                const p = e?.payload || {};
                const fishIdRaw = pd.fish_id ?? p.fish_id ?? pd.fishId ?? p.fishId;
                const fishId = Number(String(fishIdRaw));
                const name = pd.name || p.name || (language === 'ru' ? `Житель #${fishId}` : `Fish #${fishId}`);
                const owner = pd.owner || p.owner || e.owner || '';
                const shareStr = String(pd.share ?? p.share ?? '0');
                return { fishId, name, owner, shareStr } as any;
              })
              .filter((x) => Number.isFinite(x.fishId));

            const ids = rows.map((r: any) => String(r.fishId)).join(',');
            let idToAvatar: Record<string, string> = {};
            try {
              if (ids.length) {
                const rr = await fetch(`${base}/api/v1/fish/names?ids=${encodeURIComponent(ids)}`);
                if (rr.ok) {
                  const jj = await rr.json();
                  const arr = Array.isArray(jj?.data) ? jj.data : Array.isArray(jj?.items) ? jj.items : [];
                  idToAvatar = Object.fromEntries(arr.map((d: any) => [String(d.fishId), d.avatarFile])) as Record<string, string>;
                }
              }
            } catch {}

            const owners = Array.from(new Set(rows.map((r: any) => String(r.owner)).filter(Boolean)));
            const addrToSocials: Record<string, any> = {};
            try {
              await Promise.all(
                owners.map(async (addr) => {
                  try {
                    const pr = await fetchCompat(base, `/api/v1/wallet/${addr}/profile`);
                    if (pr.ok) {
                      const pj = await pr.json();
                      addrToSocials[addr] = pj?.data?.socials || pj?.socials || {};
                    }
                  } catch {}
                }),
              );
            } catch {}

            // ocean balance/shares from API (no RPC)
            let oceanBalance = 0n;
            let totalShares = 1n;
            try {
              const sumRes = await fetchCompat(base, '/api/v1/ocean/summary');
              if (sumRes.ok) {
                const sumJson = await sumRes.json();
                const data = sumJson?.data || sumJson;
                const balStr = data?.balanceLamports ?? data?.tvlLamports ?? '0';
                const sharesStr = data?.totalShares ?? '0';
                oceanBalance = BigInt(String(balStr || '0'));
                const ts = BigInt(String(sharesStr || '0'));
                totalShares = ts > 0n ? ts : 1n;
              }
            } catch {}

            const mapped: WidgetItem[] = rows.map((r: any) => {
              let valLamports = 0n;
              try {
                const share = BigInt(String(r.shareStr || '0'));
                if (share > 0n) valLamports = (oceanBalance * share) / totalShares;
              } catch {}
              const valueText = `${(Number(valLamports) / 1_000_000_000).toFixed(2)} TON`;
              const avatarFile = idToAvatar[String(r.fishId)];
              const avatarUrl = avatarFile
                ? `${base}/static/avatars/thumbs/${String(avatarFile).replace(/\.[^.]+$/, '.webp')}`
                : undefined;
              return {
                id: String(r.fishId),
                name: r.name,
                valueText,
                walletAddress: shortAddr(r.owner),
                owner: String(r.owner),
                avatarUrl,
                socials: addrToSocials[String(r.owner)] || {},
              };
            });
            if (!cancelled) setRecentItems(mapped.slice(0, 10));
          } catch {
            if (!cancelled) setRecentItems([]);
          } finally {
            if (!cancelled) setLoadingRecent(false);
          }
        })();

        const topP = (async () => {
          try {
            const r = await fetchCompat(base, '/api/v1/leaderboards/top-fish?limit=10');
            if (!r.ok) throw new Error('bad');
            const j = await r.json();
            const arr: any[] = Array.isArray(j?.data.items) ? j.data.items : [];
            const mapped: WidgetItem[] = arr.map((it: any) => {
              const valueLamports = Number(String(it.valueLamportsStr || '0'));
              const valueText = `${(valueLamports / 1_000_000_000).toFixed(2)} TON`;
              const avatarUrl = it.avatarFile
                ? `${base}/static/avatars/thumbs/${String(it.avatarFile).replace(/\.[^.]+$/, '.webp')}`
                : undefined;
              return {
                id: String(it.fishId),
                name: it.fishName || `Fish #${it.fishId}`,
                valueText,
                walletAddress: shortAddr(it.owner),
                owner: String(it.owner),
                avatarUrl,
                socials: it.socials || {},
              } as WidgetItem;
            });
            if (!cancelled) setTopItems(mapped.slice(0, 10));
          } catch {
            if (!cancelled) setTopItems([]);
          } finally {
            if (!cancelled) setLoadingTop(false);
          }
        })();

        await Promise.allSettled([recentP, topP]);
      } catch {
        if (!cancelled) {
          setLoadingRecent(false);
          setLoadingTop(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [language]);

  const currentItems = activeTab === 'new' ? recentItems : topItems;
  const loading = activeTab === 'new' ? loadingRecent : loadingTop;

  return (
    <div className="bg-[#1C1B20] rounded-3xl p-4 lg:p-6 space-y-4 lg:space-y-6">
      {/* Табы */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('new')}
          className={`px-[10px] py-[2px] rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'new' ? 'bg-[#0088FF] text-white' : 'bg-[#404040] text-[#EBEBEB]'
          }`}
        >
          {t.newFish}
        </button>
        <button
          onClick={() => setActiveTab('top')}
          className={`px-[10px] py-[2px] rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'top' ? 'bg-[#0088FF] text-white' : 'bg-[#404040] text-[#EBEBEB]'
          }`}
        >
          {t.topFish}
        </button>
      </div>

      {/* Заголовок секции */}
      <div className="space-y-2">
        <h2 className="text-xl lg:text-2xl font-bold leading-[1.1] tracking-[-0.01em] text-white">
          {activeTab === 'new' ? t.recentlyInOcean : t.topFish}
        </h2>

        {/* Заголовки таблицы */}
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <span className="text-sm lg:text-base font-medium leading-[1.1] tracking-[-0.03em] text-[#EBEBEB]">
              {t.priceInSol}
            </span>
          </div>
          <div className="w-20 lg:w-[103px] text-right">
            <span className="text-sm lg:text-base font-medium leading-[1.1] tracking-[-0.03em] text-[#EBEBEB]">
              {t.player}
            </span>
          </div>
        </div>
      </div>

      {/* Список игроков */}
      <div className="space-y-3">
        {loading && (
          <>
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={`sk-about-${i}`}
                className="flex items-center gap-3 lg:gap-4 w-full min-h-[50px] lg:h-[60px]"
              >
                <div className="w-[50px] h-[50px] lg:w-[60px] lg:h-[60px] rounded-lg overflow-hidden flex-shrink-0">
                  <div className="w-full h-full animate-pulse" style={{ background: '#2A2A2E' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="space-y-1 lg:space-y-[14px]">
                    <div
                      className="animate-pulse"
                      style={{ width: 160, height: 18, borderRadius: 6, background: '#2A2A2E' }}
                    />
                    <div
                      className="animate-pulse"
                      style={{ width: 120, height: 14, borderRadius: 6, background: '#2A2A2E' }}
                    />
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 lg:gap-[10px] flex-shrink-0">
                  <div className="flex gap-1 lg:gap-2">
                    <div className="w-5 h-5 lg:w-6 lg:h-6 bg-black/40 rounded-sm" />
                    <div className="w-5 h-5 lg:w-6 lg:h-6 bg-white/40 rounded-sm" />
                  </div>
                  <div
                    className="animate-pulse"
                    style={{ width: 100, height: 14, borderRadius: 6, background: '#2A2A2E' }}
                  />
                </div>
              </div>
            ))}
          </>
        )}

        {!loading &&
          currentItems.slice(0, 10).map((player) => (
            <div
              key={player.id}
              className="flex items-center gap-3 lg:gap-4 w-full min-h-[50px] lg:h-[60px]"
            >
              {/* Аватар */}
              <div
                className="w-[50px] h-[50px] lg:w-[60px] lg:h-[60px] rounded-lg overflow-hidden flex-shrink-0 cursor-pointer"
                onClick={() => navigate(`/fish/${player.id}`)}
                role="button"
              >
                {player.avatarUrl ? (
                  <div
                    className="w-full h-full bg-cover bg-center"
                    style={{ backgroundImage: `url('${player.avatarUrl}')` }}
                  />
                ) : (
                  <div
                    className={`w-full h-full ${
                      getAvatarGradient(player.avatarType || 'fish')
                    } flex items-center justify-center`}
                  >
                    <div className="w-6 h-6 lg:w-8 lg:h-8 bg-white/20 rounded-full" />
                  </div>
                )}
              </div>

              {/* Информация */}
              <div className="flex-1 min-w-0">
                <div className="space-y-1 lg:space-y-[14px]">
                  <h3 className="text-base lg:text-lg font-bold leading-[1.2] text-white truncate">
                    {player.name}
                  </h3>
                  <p className="text-xs lg:text-sm font-bold leading-[1.2] text-[#DEDEDE]">
                    {player.valueText}
                  </p>
                </div>
              </div>

              {/* Социальные сети и адрес */}
              <div className="flex flex-col items-end gap-2 lg:gap-[10px] flex-shrink-0">
                <div className="flex gap-1 lg:gap-2">
                  <Socials socials={player.socials} />
                </div>
                <a
                  href={player.owner ? `https://tonscan.org/address/${player.owner}` : undefined}
                  target={player.owner ? "_blank" : undefined}
                  rel={player.owner ? "noreferrer" : undefined}
                  className="text-xs lg:text-base font-bold leading-[1.2] text-[#0088FF] text-right hover:underline"
                >
                  {player.walletAddress}
                </a>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

const AboutPage: React.FC = () => {
  const { t, language } = useLanguage();
  const tr = translation[language];

  const callback = () => {};

  const renderLeftColumn = () => (
    <div className="flex flex-col space-y-14">
      {/* Hero */}
      <section className="space-y-4 sm:space-y-6">
        <h1 className="text-white font-sf-pro-display text-[26px] sm:text-[32px] lg:text-[38px] font-bold leading-[1.02] tracking-[-0.03em]">
          {renderTextToken(tr.heroSection.title)}
        </h1>
        <p className="text-[#DEDEDE] text-[16px] sm:text-[20px] leading-[1.4] tracking-[-0.02em]">
          {renderTextToken(tr.heroSection.p1)}
        </p>
        <p className="text-[#DEDEDE] text-[16px] sm:text-[20px] leading-[1.4] tracking-[-0.02em]">
          {renderTextToken(tr.heroSection.p2)}
        </p>
        <div>
          <p className="text-[#DEDEDE] font-bold text-[16px] sm:text-[20px] leading-[1.4] tracking-[-0.02em]">
            {renderTextToken(tr.heroSection.p3)}
          </p>
          <p className="text-[#DEDEDE] text-[16px] sm:text-[20px] leading-[1.4] tracking-[-0.02em]">
            {renderTextToken(tr.heroSection.p4)}
          </p>
        </div>
        <p className="text-[#DEDEDE] text-[16px] sm:text-[20px] leading-[1.4] tracking-[-0.02em]">
          {renderTextToken(tr.heroSection.p5)}
        </p>
        <div>
          <p className="text-[#DEDEDE] text-[16px] sm:text-[20px] leading-[1.4] tracking-[-0.02em]">
            {renderTextToken(tr.heroSection.p6)}
          </p>
          <p className="text-[#DEDEDE] text-[16px] sm:text-[20px] leading-[1.4] tracking-[-0.02em]">
            {renderTextToken(tr.heroSection.p7)}
          </p>
        </div>
        {/* Картинка 1 */}
        <div className="self-center">
          <img
            src="/img/about-page/1.webp"
            alt={tr.image1Alt}
            className="w-full h-full max-h-[500px] max-w-[800px]  object-contain rounded-[24px]"
          />
        </div>
      </section>

      {/* Как зарабатывать */}
      <section className="space-y-4 sm:space-y-6">
        <h2 className="text-white font-sf-pro-display text-[26px] sm:text-[32px] lg:text-[38px] font-bold leading-[1.02] tracking-[-0.03em]">
          {renderTextToken(tr.earnSection.title)}
        </h2>
        <div>
          <p className="text-[#DEDEDE] text-[16px] sm:text-[18px] leading-[1.4] tracking-[-0.02em]">
            {renderTextToken(tr.earnSection.p1)}
          </p>
          <p className="text-[#DEDEDE] text-[16px] sm:text-[18px] leading-[1.4] tracking-[-0.02em]">
            {renderTextToken(tr.earnSection.p2)}
          </p>
        </div>
        <p className="text-[#DEDEDE] text-[16px] sm:text-[18px] leading-[1.4] tracking-[-0.02em]">
          {renderTextToken(tr.earnSection.p3)}
        </p>
        <ul className="list-none space-y-2 text-[#DEDEDE] text-[15px] sm:text-[17px] leading-[1.4] tracking-[-0.02em]">
          {tr.earnSection.ul.map((li, index) => (
            <li key={index}>{renderTextToken(li)}</li>
          ))}
        </ul>
        <div>
          <p className="text-[#DEDEDE] text-[16px] sm:text-[18px] leading-[1.4] tracking-[-0.02em]">
            {renderTextToken(tr.earnSection.p4)}
          </p>
          <p className="text-[#DEDEDE] text-[16px] sm:text-[18px] leading-[1.4] tracking-[-0.02em]">
            {renderTextToken(tr.earnSection.p5)}
          </p>
        </div>
        <p className="text-[#DEDEDE] font-bold text-[16px] sm:text-[18px] leading-[1.4] tracking-[-0.02em]">
          {renderTextToken(tr.earnSection.p6)}
        </p>
        {/* Картинка 2 */}
        <div className="self-center">
          <img
            src="/img/about-page/2.webp"
            alt={tr.image2Alt}
            className="w-full h-full max-h-[500px] max-w-[800px] object-contain rounded-[24px]"
          />
        </div>
      </section>

      {/* Создание жителя */}
      <section className="space-y-4 sm:space-y-6">
        <h2 className="text-white font-sf-pro-display text-[26px] sm:text-[32px] lg:text-[38px] font-bold leading-[1.02] tracking-[-0.03em]">
          {renderTextToken(tr.createSection.title)}
        </h2>
        <p className="text-[#DEDEDE] text-[16px] sm:text-[18px] leading-[1.4] tracking-[-0.02em]">
          {renderTextToken(tr.createSection.p1)}
        </p>
        <div className="space-y-2">
          <p className="text-[#DEDEDE] text-[16px] sm:text-[18px] leading-[1.4] tracking-[-0.02em]">
            {renderTextToken(tr.createSection.p2)}
          </p>
          <ul className="list-none space-y-1 text-[#DEDEDE] text-[15px] sm:text-[17px] leading-[1.4] tracking-[-0.02em]">
            {tr.createSection.ul1.map((li, index) => (
              <li key={index}>{renderTextToken(li)}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-[#DEDEDE] font-bold text-[16px] sm:text-[18px] leading-[1.4] tracking-[-0.02em]">
            {renderTextToken(tr.createSection.p3)}
          </p>
          <p className="text-[#DEDEDE] text-[16px] sm:text-[18px] leading-[1.4] tracking-[-0.02em]">
            {renderTextToken(tr.createSection.p4)}
          </p>
        </div>
        <p className="text-[#DEDEDE] text-[16px] sm:text-[18px] leading-[1.4] tracking-[-0.02em]">
          {renderTextToken(tr.createSection.p5)}
        </p>
        <div className="space-y-2">
          <p className="text-[#DEDEDE] font-bold text-[16px] sm:text-[18px] leading-[1.4] tracking-[-0.02em]">
            {renderTextToken(tr.createSection.p6)}
          </p>
          <div className="space-y-1">
            <p className="text-[#DEDEDE] text-[16px] sm:text-[18px] leading-[1.4] tracking-[-0.02em]">
              {renderTextToken(tr.createSection.p7)}
            </p>
            {tr.createSection.ul2.map((li, index) => (
              <p className="text-[#DEDEDE] text-[15px] sm:text-[17px] leading-[1.4] tracking-[-0.02em]" key={index}>→ {renderTextToken(li)}</p>
            ))}
          </div>
        </div>
        <p className="text-[#DEDEDE] text-[16px] sm:text-[18px] leading-[1.4] tracking-[-0.02em]">
          {renderTextToken(tr.createSection.p8)}
        </p>
        {/* Картинка 3 */}
        <div className="self-center">
          <img
            src="/img/about-page/3.jpg"
            alt={tr.image3Alt}
            className="w-full h-full max-h-[500px] max-w-[800px] object-contain rounded-[24px]"
          />
        </div>
      </section>

      {/* Кормление */}
      <section className="space-y-4 sm:space-y-6">
        <h2 className="text-white font-sf-pro-display text-[26px] sm:text-[32px] lg:text-[38px] font-bold leading-[1.02] tracking-[-0.03em]">
          {renderTextToken(tr.feedSection.title)}
        </h2>
        <div>
          <p className="text-[#DEDEDE] text-[16px] sm:text-[18px] leading-[1.4] tracking-[-0.02em]">
            {renderTextToken(tr.feedSection.p1)}
          </p>
          <p className="text-[#DEDEDE] text-[16px] sm:text-[18px] leading-[1.4] tracking-[-0.02em]">
            {renderTextToken(tr.feedSection.p2)}
          </p>
        </div>
        <div className="space-y-3 sm:space-y-4">
          <p className="text-white font-sf-pro-display text-[18px] sm:text-[20px] font-semibold">
            {renderTextToken(tr.feedSection.methodsSubtitle)}
          </p>
          <p className="text-[#DEDEDE] text-[16px] sm:text-[18px] leading-[1.4] tracking-[-0.02em]">
            {renderTextToken(tr.feedSection.methodP1)}
          </p>
          <ul className="list-disc pl-5 space-y-1 text-[#DEDEDE] text-[15px] sm:text-[17px] leading-[1.4] tracking-[-0.02em]">
            {tr.feedSection.methodList.map((li, index) => (
              <li key={index}>{renderTextToken(li)}</li>
            ))}
          </ul>
          <p className="text-[#DEDEDE] text-[16px] sm:text-[18px] leading-[1.4] tracking-[-0.02em]">
            {renderTextToken(tr.feedSection.methodP2)}
          </p>
        </div>

        <div className="space-y-3 sm:space-y-4">
          <p className="text-white font-sf-pro-display text-[18px] sm:text-[20px] font-semibold">
            {renderTextToken(tr.feedSection.importantSubtitle)}
          </p>
          <ul className="list-disc pl-5 space-y-1 text-[#DEDEDE] text-[15px] sm:text-[17px] leading-[1.4] tracking-[-0.02em]">
            {tr.feedSection.importantList.map((li, index) => (
              <li key={index}>{renderTextToken(li)}</li>
            ))}
          </ul>
        </div>

        <div className="space-y-3 sm:space-y-4">
          <p className="text-white font-sf-pro-display text-[18px] sm:text-[20px] font-semibold">
            {renderTextToken(tr.feedSection.timerSubtitle)}
          </p>
          <p className="text-[#DEDEDE] text-[16px] sm:text-[18px] leading-[1.4] tracking-[-0.02em]">
            {renderTextToken(tr.feedSection.timerP1)}
          </p>
          <ul className="list-disc pl-5 space-y-1 text-[#DEDEDE] text-[15px] sm:text-[17px] leading-[1.4] tracking-[-0.02em]">
            {tr.feedSection.timerList.map((li, index) => (
              <li key={index}>{renderTextToken(li)}</li>
            ))}
          </ul>
        </div>

        <div className="space-y-3 sm:space-y-4">
          <p className="text-white font-sf-pro-display text-[18px] sm:text-[20px] font-semibold">
            {renderTextToken(tr.feedSection.exampleSubitle)}
          </p>
          <div>

            <p className="text-[#DEDEDE] text-[16px] sm:text-[18px] leading-[1.4] tracking-[-0.02em]">
              {renderTextToken(tr.feedSection.exampleP1)}
            </p>
            <p className="text-[#DEDEDE] text-[16px] sm:text-[18px] leading-[1.4] tracking-[-0.02em]">
              {renderTextToken(tr.feedSection.exampleP2)}
            </p>
          </div>
          
          <div className="space-y-1">
            <p className="text-[#DEDEDE] text-[16px] sm:text-[18px] leading-[1.4] tracking-[-0.02em]">
              {renderTextToken(tr.feedSection.exampleP3)}
            </p>
            <ul className="list-none pl-1 space-y-1 text-[#DEDEDE] text-[15px] sm:text-[17px] leading-[1.4] tracking-[-0.02em]">
              {tr.feedSection.exampleList.map((li, index) => (
                <li key={index}>→ {renderTextToken(li)}</li>
              ))}
            </ul>
          </div>
          <p className="text-[#DEDEDE] text-[16px] sm:text-[18px] leading-[1.4] tracking-[-0.02em]">
            {renderTextToken(tr.feedSection.exampleResult)}
          </p>
        </div>
        <div className="max-w-[650px] w-full mx-[auto]">
          <FishActionModalContent
            open={true}
            onClose={callback}
            confirmLabel={language === 'ru' ? 'Открыть транзакцию' : 'Open transaction'}
            onConfirm={callback}
            cancelLabel={language === 'ru' ? 'К списку жертв' : 'Close'}
            background="/img/ocean-background.png"
            imageSrc={`${apiBaseUrl}/static/avatars/1159af4030824713f535f4cad9c2953eeeb0d47b.webp`}
            fishName={'MegaDweller'}
            fishValueText={'1.10 TON'}
          >
            <FishActionFeedChildren feedDelta={0.1} />
          </FishActionModalContent>
        </div>
      </section>

      {/* Охота */}
      <section className="space-y-4 sm:space-y-6">
        <h2 className="text-white font-sf-pro-display text-[26px] sm:text-[32px] lg:text-[38px] font-bold leading-[1.02] tracking-[-0.03em]">
          {renderTextToken(tr.huntSection.title)}
        </h2>
        <p className="text-[#DEDEDE] text-[16px] sm:text-[18px] leading-[1.4] tracking-[-0.02em]">
          {renderTextToken(tr.huntSection.p1)}
        </p>
        <p className="text-[#DEDEDE] text-[16px] sm:text-[18px] leading-[1.4] tracking-[-0.02em]">
          {renderTextToken(tr.huntSection.p2)}
        </p>
        <div>
          <p className="text-[#DEDEDE] text-[16px] sm:text-[18px] leading-[1.4] tracking-[-0.02em]">
            {renderTextToken(tr.huntSection.p3)}
          </p>
          <p className="text-[#DEDEDE] text-[16px] sm:text-[18px] leading-[1.4] tracking-[-0.02em]">
            {renderTextToken(tr.huntSection.p4)}
          </p>
        </div>

        <ul className="list-none font-bold space-y-1 text-[#DEDEDE] text-[15px] sm:text-[17px] leading-[1.4] tracking-[-0.02em]">
          {tr.huntSection.ul1.map((li, index) => (
            <li key={index}>{renderTextToken(li)}</li>
          ))}
        </ul>

        <p className="text-[#DEDEDE] text-[16px] sm:text-[18px] leading-[1.4] tracking-[-0.02em]">
          {renderTextToken(tr.huntSection.p5)}
        </p>
        <p className="text-[#DEDEDE] text-[16px] sm:text-[18px] leading-[1.4] tracking-[-0.02em]">
          {renderTextToken(tr.huntSection.p6)}
        </p>

        <div className="space-y-3 sm:space-y-4">
          <p className="text-white font-sf-pro-display text-[18px] sm:text-[20px] font-semibold">
            {renderTextToken(tr.huntSection.exampleTitle)}
          </p>
          <p className="text-[#DEDEDE] text-[16px] sm:text-[18px] leading-[1.4] tracking-[-0.02em]">
            {renderTextToken(tr.huntSection.exampleP1)}
          </p>

          <ul className="list-none space-y-1 text-[#DEDEDE] text-[15px] sm:text-[17px] leading-[1.4] tracking-[-0.02em]">
            {tr.huntSection.exampleUl1.map((li, index) => (
              <li key={index}>→ {renderTextToken(li)}</li>
            ))}
          </ul>
        </div>
        {/* Пример охоты */}
        <div className="flex gap-[15px] items-center max-lg:justify-center max-lg:flex-wrap">
          <FishHuntCard
            name={'DefeatedDweller'}
            valueLamports={250000000}
            avatarFile={`4b13fb9f28e1856e198f58863ca2a79a05616b90.webp`}
            biteGainSol={0.198}
            lastFedAtSec={null}
            canHuntAfterSec={null}
            markExpiresAt={null}
            markPlacedAt={null}
            hunterCanHuntAfterSec={null}
            resetMark={() => {}}
          />
          <div className="lg:min-w-[500px] max-lg:max-w-[650px] max-lg:w-full">
            <FishActionModalContent
              open
              onClose={callback}
              confirmLabel={language === 'ru' ? 'Открыть транзакцию' : 'Open transaction'}
              cancelLabel={language === 'ru' ? 'К списку жертв' : 'Back to victims'}
              onConfirm={callback}
              background="/img/tx-error-bg.png"
              imageSrc={`${apiBaseUrl}/static/avatars/4b13fb9f28e1856e198f58863ca2a79a05616b90.webp`}
              fishName={'DefeatedDweller'}
              fishValueText={'0.7010 TON'}
            >
              <FishActionBiteChildren gain={0.56} />
            </FishActionModalContent>
          </div>
        </div>
      </section>

      {/* Охотничьи метки */}
      <section className="space-y-4 sm:space-y-6">
        <h2 className="text-white font-sf-pro-display text-[26px] sm:text-[32px] lg:text-[38px] font-bold leading-[1.02] tracking-[-0.03em]">
          {renderTextToken(tr.markSection.title)}
        </h2>
        <div className="space-y-3 sm:space-y-4">
          <p className="text-[#DEDEDE] text-[16px] sm:text-[18px] leading-[1.4] tracking-[-0.02em]">
            {renderTextToken(tr.markSection.intro1)}
          </p>
          <p className="text-[#DEDEDE] text-[16px] sm:text-[18px] leading-[1.4] tracking-[-0.02em]">
            {renderTextToken(tr.markSection.intro2)}
          </p>
          <div>
            <p className="text-[#DEDEDE] text-[16px] sm:text-[18px] leading-[1.4] tracking-[-0.02em]">
              {renderTextToken(tr.markSection.intro3)}
            </p>
            <p className="text-[#DEDEDE] text-[16px] sm:text-[18px] leading-[1.4] tracking-[-0.02em]">
              {renderTextToken(tr.markSection.intro4)}
            </p>
          </div>
          <div>
            <p className="text-[#DEDEDE] text-[16px] sm:text-[18px] leading-[1.4] tracking-[-0.02em]">
              {renderTextToken(tr.markSection.note1)}
            </p>
            <p className="text-[#DEDEDE] text-[16px] sm:text-[18px] leading-[1.4] tracking-[-0.02em]">
              {renderTextToken(tr.markSection.note2)}
            </p>
          </div>
        </div>
        
        <div className="space-y-3 sm:space-y-4">
          <p className="text-white font-sf-pro-display text-[18px] sm:text-[20px] font-semibold">
            {renderTextToken(tr.markSection.priorityTitle)}
          </p>
          <p className="text-[#DEDEDE] text-[16px] sm:text-[18px] leading-[1.4] tracking-[-0.02em]">
            {renderTextToken(tr.markSection.priorityP1)}
          </p>
          <p className="text-[#DEDEDE] text-[16px] sm:text-[18px] leading-[1.4] tracking-[-0.02em]">
            {renderTextToken(tr.markSection.priorityIntro)}
          </p>
          <ul className="list-none space-y-1 text-[#DEDEDE] text-[15px] sm:text-[17px] leading-[1.4] tracking-[-0.02em]">
            {tr.markSection.priorityList.map((item, index) => (
              <li key={index}>• {renderTextToken(item)}</li>
            ))}
          </ul>
          <p className="text-[#DEDEDE] text-[16px] sm:text-[18px] leading-[1.4] tracking-[-0.02em]">
            {renderTextToken(tr.markSection.priorityP2)}
          </p>
          <p className="text-[#DEDEDE] text-[16px] sm:text-[18px] leading-[1.4] tracking-[-0.02em]">
            {renderTextToken(tr.markSection.riskNote)}
          </p>
        </div>
        
        <div className="space-y-3 sm:space-y-4">
          <p className="text-white font-sf-pro-display text-[18px] sm:text-[20px] font-semibold">
            {renderTextToken(tr.markSection.priceTitle)}
          </p>
          <ul className="list-none space-y-1 text-[#DEDEDE] text-[15px] sm:text-[17px] leading-[1.4] tracking-[-0.02em]">
            {tr.markSection.priceList.map((item, index) => (
              <li key={index}>• {renderTextToken(item)}</li>
            ))}
          </ul>
          <p className="text-[#DEDEDE] text-[16px] sm:text-[18px] leading-[1.4] tracking-[-0.02em]">
            {renderTextToken(tr.markSection.priceP1)}
          </p>
        </div>
        
        <div className="space-y-3 sm:space-y-4">
          <p className="text-white font-sf-pro-display text-[18px] sm:text-[20px] font-semibold">
            {renderTextToken(tr.markSection.distributionTitle)}
          </p>
          <ul className="list-none space-y-1 text-[#DEDEDE] text-[15px] sm:text-[17px] leading-[1.4] tracking-[-0.02em]">
            {tr.markSection.distributionList.map((item, index) => (
              <li key={index}>{renderTextToken(item)}</li>
            ))}
          </ul>
        
        </div>
        <p className="text-[#DEDEDE] text-[16px] sm:text-[18px] leading-[1.4] tracking-[-0.02em]">
          {renderTextToken(tr.markSection.finalNote)}
        </p>

        {/* Пример охотничьей метки */}
        <div className="max-w-[650px] w-full mx-[auto]">
          <FishActionModalContent
            open
            onClose={callback}
            onConfirm={callback}
            confirmLabel={`${t.mark.modalConfirm} 0.0147 TON`}
            cancelLabel={t.mark.modalCancel}
            background="/img/tx-error-bg.png"
            imageSrc={`${apiBaseUrl}/static/avatars/fdba0de914bae9a0bad4fd7b2a7c26b49c11fad0.webp`}
            fishName={'MarkedDweller'}
            fishValueText={'0.29 TON'}
          >
            <div className="text-white/90 text-[14px] leading-[1.4] tracking-[-0.03em]">
              {renderTextToken(t.mark.modalText)}
            </div>
          </FishActionModalContent>
        </div>
      </section>

      {/* Выход из игры */}
      <section className="space-y-4 sm:space-y-6">
        <h2 className="text-white font-sf-pro-display text-[26px] sm:text-[32px] lg:text-[38px] font-bold leading-[1.02] tracking-[-0.03em]">
          {renderTextToken(tr.exitSection.title)}
        </h2>
        <p className="text-[#DEDEDE] text-[16px] sm:text-[18px] leading-[1.4] tracking-[-0.02em]">
          {renderTextToken(tr.exitSection.intro)}
        </p>
        <p className="text-[#DEDEDE] text-[16px] sm:text-[18px] leading-[1.4] tracking-[-0.02em]">
          {renderTextToken(tr.exitSection.stormNote)}
        </p>
        <div className="space-y-2">
          <p className="text-[#DEDEDE] text-[16px] sm:text-[18px] leading-[1.4] tracking-[-0.02em]">
            {renderTextToken(tr.exitSection.commissionTitle)}
          </p>
          <ul className="list-none space-y-1 text-[#DEDEDE] text-[15px] sm:text-[17px] leading-[1.4] tracking-[-0.02em]">
            {tr.exitSection.commissionList.map((item, index) => (
              <li key={index}>{renderTextToken(item)}</li>
            ))}
          </ul>
        </div>
        <div className="space-y-2 text-[#DEDEDE] text-[15px] sm:text-[17px] leading-[1.4] tracking-[-0.02em]">
          <p className="text-white font-sf-pro-display text-[18px] sm:text-[20px] font-semibold">{renderTextToken(tr.exitSection.exampleTitle)}</p>
          <div className="space-y-1">
            <p>{renderTextToken(tr.exitSection.exampleWeight)}</p>
            <p>{renderTextToken(tr.exitSection.examplePlayer)}</p>
            <p>{renderTextToken(tr.exitSection.exampleOther)}</p>
            <p>{renderTextToken(tr.exitSection.exampleAdmins)}</p>
          </div>
        </div>
        {/* Пример выхода из игры */}
        <div className="max-w-[650px] w-full mx-[auto]">
          <FishActionModalContent
            open
            onClose={callback}
            onConfirm={callback}
            confirmLabel={`${t.sell.modalConfirmPrefix} 0.0886 TON`}
            cancelLabel={t.sell.modalCancel}
            background="/img/ocean-background.png"
            imageSrc={`${apiBaseUrl}/static/avatars/142cc17be6d41991ec414aa8ba34fe60d69ce34c.webp`}
            fishName={'SellDweller'}
            fishValueText={`0.0984 TON`}
          >
            <FishActionSellChildren amount={'0.0886 TON'} />
          </FishActionModalContent>
        </div>
      </section>
      
      {/* Состояния океана */}
      <section className="space-y-4 sm:space-y-6">
        <h2 className="text-white font-sf-pro-display text-[26px] sm:text-[32px] lg:text-[38px] font-bold leading-[1.02] tracking-[-0.03em] mt-4">
          {renderTextToken(tr.oceanSection.title)}
        </h2>
        <p className="text-[#DEDEDE] text-[16px] sm:text-[18px] leading-[1.4] tracking-[-0.02em]">
          {renderTextToken(tr.oceanSection.intro)}
        </p>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-white font-sf-pro-display text-[18px] sm:text-[20px] font-semibold">{renderTextToken(tr.oceanSection.calmTitle)}</p>
            <p>{renderTextToken(tr.oceanSection.calmFeeding)}</p>
            <p>{renderTextToken(tr.oceanSection.calmExit)}</p>
            <p>{renderTextToken(tr.oceanSection.calmRisk)}</p>
          </div>
          <div className="space-y-2 max-w-[600px] w-full self-center">
            <div className="w-full h-[80px] sm:h-[100px] rounded-[24px] overflow-hidden">
              <img
                src="/img/about-page/6.png"
                alt={tr.image6Alt}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-white font-sf-pro-display text-[18px] sm:text-[20px] font-semibold">{renderTextToken(tr.oceanSection.stormTitle)}</p>
            <p>{renderTextToken(tr.oceanSection.stormFeeding)}</p>
            <p>{renderTextToken(tr.oceanSection.stormExit)}</p>
            <p>{renderTextToken(tr.oceanSection.stormRisk)}</p>
          </div>
          <div className="space-y-2 max-w-[600px] w-full self-center">
            <div className="w-full h-[80px] sm:h-[100px] rounded-[24px] overflow-hidden">
              <img
                src="/img/about-page/7.png"
                alt={tr.image7Alt}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
        
        <div className="space-y-3 sm:space-y-4">
          <p className="text-[#DEDEDE] text-[16px] sm:text-[18px] leading-[1.4] tracking-[-0.02em]">
            {renderTextToken(tr.oceanSection.durationNote)}
          </p>
          <div>
            <p className="text-[#DEDEDE] text-[16px] sm:text-[18px] leading-[1.4] tracking-[-0.02em]">
              {renderTextToken(tr.oceanSection.changeNote)}
            </p>
            <p className="text-[#DEDEDE] text-[16px] sm:text-[18px] leading-[1.4] tracking-[-0.02em]">
              {renderTextToken(tr.oceanSection.probabilityNote)}
            </p>
          </div>
          <p className="text-[#DEDEDE] text-[16px] sm:text-[18px] leading-[1.4] tracking-[-0.02em]">
            {renderTextToken(tr.oceanSection.finalNote)}
          </p>
        </div>
      </section>

      {/* Дополнительно */}
      <section className="space-y-4 sm:space-y-6">
        <h2 className="text-white font-sf-pro-display text-[26px] sm:text-[32px] lg:text-[38px] font-bold leading-[1.02] tracking-[-0.03em]">
          {renderTextToken(tr.extraSection.title)}
        </h2>
        <ul className="list-none space-y-1 text-[#DEDEDE] text-[15px] sm:text-[17px] leading-[1.4] tracking-[-0.02em]">
          {tr.extraSection.list.map((item, index) => (
            <li key={index}>• {renderTextToken(item)}</li>
          ))}
        </ul>
        <div className="space-y-3 sm:space-y-4">
          <p className="text-white font-sf-pro-display text-[20px] sm:text-[22px] font-semibold">
            {renderTextToken(tr.extraSection.simpleIdeaTitle)}
          </p>
          <ul className="list-none space-y-1 text-[#DEDEDE] text-[15px] sm:text-[17px] leading-[1.4] tracking-[-0.02em]">
            {tr.extraSection.simpleIdeaList.map((item, index) => (
              <li key={index}>{renderTextToken(item)}</li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );

  return (
    <div className="text-white">
      {/* Mobile: stacked layout */}
      <div className="lg:hidden flex flex-col gap-8">
        {renderLeftColumn()}
        <RecentlyInOceanWidget />
      </div>

      {/* Desktop: two-column layout like FishPage */}
      <div className="hidden lg:grid grid-cols-1 lg:grid-cols-[minmax(0,821px)_minmax(0,378px)] lg:gap-12 xl:gap-[80px] lg:mt-[3rem]">
        <div className="flex w-full flex-col">
          {renderLeftColumn()}
        </div>
        <div className="flex w-full lg:flex-col">
          <RecentlyInOceanWidget />
        </div>
      </div>
    </div>

  );
};

export default AboutPage;
