import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Language } from '../locales/translations';

interface LanguageDropdownProps {
  onClose: () => void;
}

const LanguageDropdown: React.FC<LanguageDropdownProps> = ({ onClose }) => {
  const { language, setLanguage, t } = useLanguage();

  const languages = [
    { code: 'ru' as Language, name: t.languages.russian, flag: '🇷🇺' },
    { code: 'en' as Language, name: t.languages.english, flag: '🇺🇸' },
  ];

  const handleLanguageSelect = (languageCode: Language) => {
    setLanguage(languageCode);
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <div className="space-y-5">
      {/* Заголовок */}
      <div className="w-[312px]">
        <h2 className="text-[24px] font-bold leading-[1.1] tracking-[-0.01em] text-white font-sf-pro-display">
          {t.selectLanguage}
        </h2>
      </div>

      {/* Список языков */}
      <div className="space-y-5">
        {languages.map((lang) => (
          <div key={lang.code} className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#252525] rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-lg">{lang.flag}</span>
            </div>
            <div className="flex-1">
              <button
                onClick={() => handleLanguageSelect(lang.code)}
                className="text-left w-full"
              >
                <h3 className={`text-[18px] font-bold leading-[1.2] font-sf-pro-display transition-colors ${
                  language === lang.code 
                    ? 'text-[#0088FF]' 
                    : 'text-white hover:text-[#0088FF]'
                }`}>
                  {lang.name}
                </h3>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Кнопка отмены */}
      <div className="pt-2">
        <button
          onClick={handleCancel}
          className="w-full bg-[#111013] hover:bg-[#2A2A2E] transition-colors rounded-lg py-[14px] px-[30px]"
        >
          <span className="text-[16px] font-bold leading-[1.02] tracking-[-0.04em] text-white font-sf-pro-display">
            {t.cancel}
          </span>
        </button>
      </div>
    </div>
  );
};

export default LanguageDropdown;
