import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const PRIVACY_TEXT = {
  ru: {
    title: 'Privacy Policy (Политика конфиденциальности)',
    updated: 'Последнее обновление: 14.12.2025',
    s1_title: '1. Общие положения',
    s1_p1:
      'HODL HUNT — это PvP-игра с серверной обработкой действий и хранением состояния в базе данных. Мы уважаем приватность пользователей и не собираем избыточные персональные данные.',
    s1_p2:
      'Используя сайт HODL HUNT, вы соглашаетесь с данной Политикой конфиденциальности.',
    s2_title: '2. Какие данные мы можем получать',
    s2_p1:
      'Мы не собираем и не храним персональные данные, такие как имя, паспорт, адрес или платёжные реквизиты.',
    s2_p2: 'В процессе использования сайта могут автоматически обрабатываться:',
    s2_list: [
      'публичный адрес криптокошелька',
      'ссылки на системные операции TON и игровые действия',
      'технические данные: IP-адрес, тип браузера, cookies',
      'обезличенная аналитика посещений сайта',
    ],
    s3_title: '3. Что мы НЕ храним',
    s3_p1: 'Критически важно:',
    s3_list: [
      'мы не храним приватные ключи',
      'мы не имеем доступа к средствам пользователей',
      'мы не контролируем кошельки',
      'мы не можем отменять или изменять транзакции',
    ],
    s3_p2:
      'Игровые действия подтверждаются пользователем и затем обрабатываются backend-сервисом с фиксацией в базе данных.',
    s4_title: '4. Как используются данные',
    s4_p1: 'Данные используются исключительно для:',
    s4_list: [
      'корректной работы сайта и интерфейса игры',
      'отображения игровых действий и статистики',
      'обеспечения безопасности и предотвращения злоупотреблений',
      'улучшения пользовательского опыта',
    ],
    s4_p2:
      'Мы не продаём и не передаём данные третьим лицам, за исключением технических сервисов аналитики и хостинга.',
    s5_title: '5. Cookies',
    s5_p1:
      'Сайт может использовать cookies для базовой аналитики и корректной работы интерфейса. Вы можете отключить cookies в настройках браузера.',
    s6_title: '6. Ссылки на сторонние сервисы',
    s6_p1:
      'Сайт может содержать ссылки на сторонние ресурсы (кошельки, платёжные сервисы, обозреватели операций). Мы не несем ответственности за их политику конфиденциальности.',
    s7_title: '7. Изменения политики',
    s7_p1:
      'Мы можем обновлять данную Политику. Актуальная версия всегда доступна на сайте.',
    s8_title: '8. Контакты',
    s8_prefix:
      'По вопросам конфиденциальности вы можете связаться с командой проекта через официальные каналы, указанные на сайте ',
    s8_suffix: '.',
  },
  en: {
    title: 'Privacy Policy',
    updated: 'Last updated: 14.12.2025',
    s1_title: '1. General Provisions',
    s1_p1:
      'HODL HUNT is a PvP strategy game with server-side processing and database-backed state.',
    s1_p2:
      'We respect user privacy and do not collect unnecessary personal data. By using the HODL HUNT website, you agree to this Privacy Policy.',
    s2_title: '2. Information We May Collect',
    s2_p1:
      'We do not collect or store personal information such as names, addresses, identification documents, or payment details.',
    s2_p2: 'When using the website, the following data may be processed automatically:',
    s2_list: [
      'public cryptocurrency wallet address',
      'TON transaction references and in-game activity metadata',
      'technical data such as IP address, browser type, cookies',
      'anonymized website analytics',
    ],
    s3_title: '3. Information We Do NOT Store',
    s3_p1: 'Important notice:',
    s3_list: [
      'we do not store private keys',
      'we do not control user wallets',
      'we do not have access to user funds',
      'we cannot retroactively change confirmed system operations',
    ],
    s3_p2:
      'User-confirmed actions are processed by backend services and recorded in the database.',
    s4_title: '4. Use of Information',
    s4_p1: 'Collected data is used solely for:',
    s4_list: [
      'ensuring proper website and interface functionality',
      'displaying game mechanics and statistics',
      'improving security and preventing abuse',
      'enhancing user experience',
    ],
    s4_p2:
      'We do not sell or share personal data with third parties, except for essential analytics or hosting providers.',
    s5_title: '5. Cookies',
    s5_p1:
      'The website may use cookies for basic functionality and analytics purposes. You may disable cookies in your browser settings.',
    s6_title: '6. Third-Party Links',
    s6_p1:
      'The website may contain links to third-party services such as wallets, payment services, or operation explorers. We are not responsible for their privacy practices.',
    s7_title: '7. Policy Updates',
    s7_p1:
      'This Privacy Policy may be updated periodically. The current version will always be available on the website.',
    s8_title: '8. Contact',
    s8_prefix:
      'For privacy-related questions, please contact the project team through the official channels listed on ',
    s8_suffix: '.',
  },
} as const;

const PrivacyPage: React.FC = () => {
  const { language } = useLanguage();
  const texts = PRIVACY_TEXT[language === 'ru' ? 'ru' : 'en'];

  return (
    <div className="text-white">
      <div className="max-w-3xl mx-auto space-y-8">
        <header className="space-y-3">
          <h1 className="text-[28px] sm:text-[32px] font-sf-pro-display font-bold leading-[1.1] tracking-[-0.03em]">
            {texts.title}
          </h1>
          <p className="text-sm text-[#BDBABA]">{texts.updated}</p>
        </header>

        <div className="space-y-6 text-[14px] sm:text-[16px] leading-[1.6] text-[#DEDEDE]">
          <section className="space-y-3">
            <h2 className="text-[18px] sm:text-[20px] font-bold text-white">
              {texts.s1_title}
            </h2>
            <p>{texts.s1_p1}</p>
            <p>{texts.s1_p2}</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-[18px] sm:text-[20px] font-bold text-white">
              {texts.s2_title}
            </h2>
            <p>{texts.s2_p1}</p>
            <p>{texts.s2_p2}</p>
            <ul className="list-disc pl-6 space-y-1">
              {texts.s2_list.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-[18px] sm:text-[20px] font-bold text-white">
              {texts.s3_title}
            </h2>
            <p>{texts.s3_p1}</p>
            <ul className="pl-1 space-y-1">
              {texts.s3_list.map((item) => (
                <li key={item} className="flex gap-2">
                  <span aria-hidden="true">❌</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p>{texts.s3_p2}</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-[18px] sm:text-[20px] font-bold text-white">
              {texts.s4_title}
            </h2>
            <p>{texts.s4_p1}</p>
            <ul className="list-disc pl-6 space-y-1">
              {texts.s4_list.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p>{texts.s4_p2}</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-[18px] sm:text-[20px] font-bold text-white">
              {texts.s5_title}
            </h2>
            <p>{texts.s5_p1}</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-[18px] sm:text-[20px] font-bold text-white">
              {texts.s6_title}
            </h2>
            <p>{texts.s6_p1}</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-[18px] sm:text-[20px] font-bold text-white">
              {texts.s7_title}
            </h2>
            <p>{texts.s7_p1}</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-[18px] sm:text-[20px] font-bold text-white">
              {texts.s8_title}
            </h2>
            <p>
              {texts.s8_prefix}
              <a
                href="https://hodlhunt.io"
                target="_blank"
                rel="noreferrer"
                className="text-[#0088FF] underline"
              >
                hodlhunt.io
              </a>
              {texts.s8_suffix}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;
