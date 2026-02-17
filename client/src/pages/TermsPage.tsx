import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const TERMS_TEXT = {
  ru: {
    title: 'Terms of Service (Пользовательское соглашение)',
    updated: 'Последнее обновление: 14.12.2025',
    s1_title: '1. Принятие условий',
    s1_intro: 'Используя сайт и игровые сервисы HODL HUNT, вы подтверждаете, что:',
    s1_list: [
      'понимаете механику игры',
      'осознаёте финансовые риски',
      'принимаете данные условия полностью',
    ],
    s1_outro: 'Если вы не согласны — не используйте проект.',
    s2_title: '2. Что такое HODL HUNT',
    s2_intro: 'HODL HUNT — это:',
    s2_list: [
      'стратегическая PvP-игра',
      'игровой сервис с серверной обработкой действий',
      'система с реальными рисками и потерей средств',
    ],
    s2_p1: 'HODL HUNT не является инвестиционным продуктом.',
    s2_p2: 'Мы не обещаем доход, прибыль или сохранность средств.',
    s3_title: '3. Ответственность пользователя',
    s3_intro: 'Пользователь:',
    s3_list: [
      'самостоятельно принимает решения',
      'несёт полную ответственность за свои действия',
      'осознаёт возможность полной потери средств',
    ],
    s3_p1:
      'Ошибки, невнимательность, отсутствие кормления или неверная стратегия — часть игрового процесса.',
    s4_title: '4. Работа сервиса',
    s4_p1: 'Игровые действия обрабатываются серверной частью проекта и фиксируются в базе данных.',
    s4_p2: 'Сервис предоставляется по принципу “as is” (как есть).',
    s4_p3: 'Команда может обновлять серверную логику, интерфейс и механики для стабильной работы проекта.',
    s4_p4: 'Некоторые операции в системе могут быть необратимыми после подтверждения.',
    s4_p5:
      'Пользователь понимает, что взаимодействие с онлайн-сервисом может включать технические и финансовые риски.',
    s5_title: '5. Отсутствие гарантий',
    s5_intro: 'Мы не гарантируем:',
    s5_list: [
      'прибыль',
      'сохранность средств',
      'отсутствие ошибок',
      'постоянную доступность сайта',
    ],
    s5_p1: 'Использование проекта осуществляется на собственный риск.',
    s6_title: '6. Ограничение ответственности',
    s6_intro: 'Команда HODL HUNT не несёт ответственности за:',
    s6_list: [
      'финансовые потери',
      'упущенную выгоду',
      'ошибки пользователя',
      'сбои внешних инфраструктур и платёжных сервисов',
      'действия третьих лиц',
    ],
    s7_title: '7. Ограничение доступа',
    s7_intro: 'Мы оставляем за собой право:',
    s7_list: ['ограничить доступ к сайту', 'приостановить интерфейс', 'обновлять или изменять функционал'],
    s7_p1: 'Это не отменяет уже подтверждённые игровые операции в системе.',
    s8_title: '8. Юридические ограничения',
    s8_p1:
      'Пользователь самостоятельно отвечает за соблюдение законов своей юрисдикции. Проект может быть недоступен или ограничен в некоторых странах.',
    s9_title: '9. Изменения условий',
    s9_p1: 'Условия могут обновляться.',
    s9_p2:
      'Продолжение использования проекта означает согласие с новой версией Пользовательского соглашения.',
    s10_title: '10. Контакты',
    s10_prefix: 'Официальные каналы связи указаны на сайте проекта ',
    s10_suffix: '.',
  },
  en: {
    title: 'Terms of Service',
    updated: 'Last updated: 14.12.2025',
    s1_title: '1. Acceptance of Terms',
    s1_intro:
      'By accessing or interacting with the HODL HUNT website and game services, you confirm that you:',
    s1_list: [
      'understand the game mechanics',
      'accept all financial and technical risks',
      'agree to these Terms of Service in full',
    ],
    s1_outro: 'If you do not agree, do not use the project.',
    s2_title: '2. Nature of the Project',
    s2_intro: 'HODL HUNT is:',
    s2_list: [
      'a strategic PvP game service',
      'a server-driven system with backend processing',
      'a risk-based environment involving real funds',
    ],
    s2_p1: 'HODL HUNT is not an investment product.',
    s2_p2: 'No income, profit, or capital preservation is promised or guaranteed.',
    s3_title: '3. User Responsibility',
    s3_intro: 'The user:',
    s3_list: [
      'makes all decisions independently',
      'bears full responsibility for their actions',
      'understands that total loss of funds is possible',
    ],
    s3_p1:
      'Failure to feed a creature, incorrect strategy, or misjudgment of risk is an intentional part of the gameplay.',
    s4_title: '4. Service Operation',
    s4_p1: 'Game actions are processed by the project backend and recorded in the database.',
    s4_p2: 'The service is provided on an “as is” basis.',
    s4_p3: 'Some operations in the system may be irreversible after confirmation.',
    s4_p4: 'The team may update backend logic, interface and gameplay mechanics to keep the service stable.',
    s4_p5: 'Users acknowledge the inherent technical and financial risks of using online services.',
    s5_title: '5. No Guarantees',
    s5_intro: 'We do not guarantee:',
    s5_list: [
      'profitability',
      'protection of funds',
      'error-free operation',
      'uninterrupted access to the website',
    ],
    s5_p1: 'Participation is entirely at the user’s own risk.',
    s6_title: '6. Limitation of Liability',
    s6_intro: 'The HODL HUNT team is not liable for:',
    s6_list: [
      'financial losses',
      'lost profits or opportunities',
      'user mistakes or negligence',
      'failures of external infrastructure or payment services',
      'actions of third parties',
    ],
    s7_title: '7. Access Restrictions',
    s7_intro: 'We reserve the right to:',
    s7_list: [
      'limit or suspend website access',
      'update or modify the interface',
      'restrict availability in certain regions',
    ],
    s7_p1: 'This does not cancel operations that have already been confirmed in the system.',
    s8_title: '8. Legal Compliance',
    s8_p1:
      'Users are solely responsible for complying with the laws and regulations of their jurisdiction. The project may be restricted or unavailable in certain countries.',
    s9_title: '9. Amendments',
    s9_p1: 'These Terms may be updated at any time.',
    s9_p2:
      'Continued use of the project constitutes acceptance of the updated Terms of Service.',
    s10_title: '10. Contact',
    s10_prefix: 'Official communication channels are listed on ',
    s10_suffix: '.',
  },
} as const;

const TermsPage: React.FC = () => {
  const { language } = useLanguage();
  const texts = TERMS_TEXT[language === 'ru' ? 'ru' : 'en'];

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
            <p>{texts.s1_intro}</p>
            <ul className="list-disc pl-6 space-y-1">
              {texts.s1_list.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p>{texts.s1_outro}</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-[18px] sm:text-[20px] font-bold text-white">
              {texts.s2_title}
            </h2>
            <p>{texts.s2_intro}</p>
            <ul className="list-disc pl-6 space-y-1">
              {texts.s2_list.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p>{texts.s2_p1}</p>
            <p>{texts.s2_p2}</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-[18px] sm:text-[20px] font-bold text-white">
              {texts.s3_title}
            </h2>
            <p>{texts.s3_intro}</p>
            <ul className="list-disc pl-6 space-y-1">
              {texts.s3_list.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p>{texts.s3_p1}</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-[18px] sm:text-[20px] font-bold text-white">
              {texts.s4_title}
            </h2>
            <p>{texts.s4_p1}</p>
            <p>{texts.s4_p2}</p>
            <p>{texts.s4_p3}</p>
            <p>{texts.s4_p4}</p>
            <p>{texts.s4_p5}</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-[18px] sm:text-[20px] font-bold text-white">
              {texts.s5_title}
            </h2>
            <p>{texts.s5_intro}</p>
            <ul className="list-disc pl-6 space-y-1">
              {texts.s5_list.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p>{texts.s5_p1}</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-[18px] sm:text-[20px] font-bold text-white">
              {texts.s6_title}
            </h2>
            <p>{texts.s6_intro}</p>
            <ul className="list-disc pl-6 space-y-1">
              {texts.s6_list.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-[18px] sm:text-[20px] font-bold text-white">
              {texts.s7_title}
            </h2>
            <p>{texts.s7_intro}</p>
            <ul className="list-disc pl-6 space-y-1">
              {texts.s7_list.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p>{texts.s7_p1}</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-[18px] sm:text-[20px] font-bold text-white">
              {texts.s8_title}
            </h2>
            <p>{texts.s8_p1}</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-[18px] sm:text-[20px] font-bold text-white">
              {texts.s9_title}
            </h2>
            <p>{texts.s9_p1}</p>
            <p>{texts.s9_p2}</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-[18px] sm:text-[20px] font-bold text-white">
              {texts.s10_title}
            </h2>
            <p>
              {texts.s10_prefix}
              <a
                href="https://hodlhunt.io"
                target="_blank"
                rel="noreferrer"
                className="text-[#0088FF] underline"
              >
                hodlhunt.io
              </a>
              {texts.s10_suffix}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
