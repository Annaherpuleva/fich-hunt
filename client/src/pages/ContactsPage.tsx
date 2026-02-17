import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Language } from '../locales/translations';

type ContactsTranslations = {
  title: string;
  intro: string;

  emailTitle: string;
  emailDescription: string;
  emailAddress: string;
  emailNote: string;

  telegramTitle: string;
  telegramChannelLabel: string;
  telegramChannelHandle: string;
  telegramNote: string;

  supportTitle: string;
  supportIntro: string;
  supportDetailsIntro: string;
  supportDetailsList: string[];
  supportDetailsNote: string;

  partnersTitle: string;
  partnersIntro: string;
  partnersEmail: string;
};

const contactsTranslation: Record<Language, ContactsTranslations> = {
  ru: {
    title: 'Контакты',
    intro:
      'Если у вас есть вопросы по проекту HODL HUNT, работе платформы или предложения по сотрудничеству — вы можете связаться с нами любым удобным способом.',

    emailTitle: '📩 Электронная почта',
    emailDescription: 'По всем вопросам:',
    emailAddress: 'support@hodlhunt.io',
    emailNote: '(отвечаем в разумные сроки, без авто-отписок)',

    telegramTitle: '💬 Telegram',
    telegramChannelLabel: 'Официальный канал проекта:',
    telegramChannelHandle: '@HodlHunt',
    telegramNote:
      'Для оперативной связи и объявлений используем Telegram — это основной канал коммуникации.',

    supportTitle: '🛠 Техническая поддержка',
    supportIntro:
      'Если вы столкнулись с ошибкой, некорректной работой интерфейса или смарт-контракта, пожалуйста, опишите проблему максимально подробно и укажите:',
    supportDetailsIntro: 'Пожалуйста, укажите в обращении:',
    supportDetailsList: ['ваш кошелёк', 'время возникновения проблемы', 'что именно пошло не так'],
    supportDetailsNote: 'Это сильно ускорит решение.',

    partnersTitle: '🤝 Сотрудничество и партнёрства',
    partnersIntro:
      'По вопросам партнёрства, интеграций и других предложений пишите на:',
    partnersEmail: 'partners@hodlhunt.io',
  },
  en: {
    title: 'Contacts',
    intro:
      'If you have any questions about the HODL HUNT project, how the platform works, or ideas for collaboration, you can reach us using any of the channels below.',

    emailTitle: '📩 Email',
    emailDescription: 'For any questions:',
    emailAddress: 'support@hodlhunt.io',
    emailNote: '(we reply within a reasonable time, no automated spam responses)',

    telegramTitle: '💬 Telegram',
    telegramChannelLabel: 'Official project channel:',
    telegramChannelHandle: '@HodlHunt',
    telegramNote:
      'We use Telegram for quick updates and announcements — this is our primary communication channel.',

    supportTitle: '🛠 Technical support',
    supportIntro:
      'If you encounter a bug, interface issue or suspect incorrect smart‑contract behaviour, please describe the problem in as much detail as possible and include:',
    supportDetailsIntro: 'Please include in your message:',
    supportDetailsList: ['your wallet address', 'approximate time when the issue occurred', 'what exactly went wrong'],
    supportDetailsNote: 'This will help us resolve the issue much faster.',

    partnersTitle: '🤝 Cooperation and partnerships',
    partnersIntro:
      'For partnership, integration or other collaboration proposals, please email:',
    partnersEmail: 'partners@hodlhunt.io',
  },
};

const ContactsPage: React.FC = () => {
  const { language } = useLanguage();
  const tr = contactsTranslation[language];

  return (
    <div className="text-white">
      <div className="max-w-3xl mx-auto flex flex-col gap-6">
        {/* Header */}
        <section className="space-y-4">
          <h1 className="text-white font-sf-pro-display text-[28px] sm:text-[36px] lg:text-[40px] font-bold leading-[1.05] tracking-[-0.03em]">
            {tr.title}
          </h1>
          <p className="text-[#DEDEDE] text-[16px] sm:text-[18px] leading-[1.5] tracking-[-0.02em]">
            {tr.intro}
          </p>
        </section>

        {/* Email */}
        <section className="space-y-3 bg-[#1C1B20] rounded-[24px] px-5 py-6 sm:px-7 sm:py-7">
          <h2 className="text-white font-sf-pro-display text-[20px] sm:text-[22px] font-semibold leading-[1.2] tracking-[-0.02em]">
            {tr.emailTitle}
          </h2>
          <p className="text-[#DEDEDE] text-[15px] sm:text-[17px] leading-[1.5]">
            {tr.emailDescription}
          </p>
          <a
            href={`mailto:${tr.emailAddress}`}
            className="inline-flex text-[15px] sm:text-[17px] font-semibold text-[#0088FF] hover:underline break-all"
          >
            {tr.emailAddress}
          </a>
          <p className="text-[#A5A5A5] text-[13px] sm:text-[14px] leading-[1.4]">
            {tr.emailNote}
          </p>
        </section>

        {/* Telegram */}
        <section className="space-y-3 bg-[#1C1B20] rounded-[24px] px-5 py-6 sm:px-7 sm:py-7">
          <h2 className="text-white font-sf-pro-display text-[20px] sm:text-[22px] font-semibold leading-[1.2] tracking-[-0.02em]">
            {tr.telegramTitle}
          </h2>
          <p className="text-[#DEDEDE] text-[15px] sm:text-[17px] leading-[1.5]">
            {tr.telegramChannelLabel}
          </p>
          <a
            href="https://t.me/HodlHunt"
            target="_blank"
            rel="noreferrer"
            className="inline-flex text-[15px] sm:text-[17px] font-semibold text-[#0088FF] hover:underline"
          >
            {tr.telegramChannelHandle}
          </a>
          <p className="text-[#DEDEDE] text-[15px] sm:text-[17px] leading-[1.5]">
            {tr.telegramNote}
          </p>
        </section>

        {/* Support */}
        <section className="space-y-3 bg-[#1C1B20] rounded-[24px] px-5 py-6 sm:px-7 sm:py-7">
          <h2 className="text-white font-sf-pro-display text-[20px] sm:text-[22px] font-semibold leading-[1.2] tracking-[-0.02em]">
            {tr.supportTitle}
          </h2>
          <p className="text-[#DEDEDE] text-[15px] sm:text-[17px] leading-[1.5]">
            {tr.supportIntro}
          </p>
          <p className="text-[#DEDEDE] text-[15px] sm:text-[17px] leading-[1.5] font-semibold">
            {tr.supportDetailsIntro}
          </p>
          <ul className="list-disc pl-5 space-y-1 text-[#DEDEDE] text-[15px] sm:text-[17px] leading-[1.5]">
            {tr.supportDetailsList.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="text-[#DEDEDE] text-[15px] sm:text-[17px] leading-[1.5]">
            {tr.supportDetailsNote}
          </p>
        </section>

        {/* Partnerships */}
        <section className="space-y-3 bg-[#1C1B20] rounded-[24px] px-5 py-6 sm:px-7 sm:py-7">
          <h2 className="text-white font-sf-pro-display text-[20px] sm:text-[22px] font-semibold leading-[1.2] tracking-[-0.02em]">
            {tr.partnersTitle}
          </h2>
          <p className="text-[#DEDEDE] text-[15px] sm:text-[17px] leading-[1.5]">
            {tr.partnersIntro}
          </p>
          <a
            href={`mailto:${tr.partnersEmail}`}
            className="inline-flex text-[15px] sm:text-[17px] font-semibold text-[#0088FF] hover:underline break-all"
          >
            {tr.partnersEmail}
          </a>
        </section>
      </div>
    </div>
  );
};

export default ContactsPage;
