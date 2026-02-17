import React, { useCallback, useEffect, useMemo, useState } from 'react';
import '../css/components/AlphaGate.css';

type Lang = 'ru' | 'en';

const SALT = 'alpha-gate-v1';
const STORAGE_KEY = 'alpha_gate_ok_v1';

/** Допустимые хеши: sha256(код + SALT). Включает старый код + 10 новых. */
const ALLOWED_HASHES = new Set([
  'f0d7b2a0c8bbf884efa3c7e9bf42d321456b8bfa374fbec0e76039761e56b311', // старый код
  'd248156e34282722f30a6b63efb0ee3310d9dda545a5bd0a5bb04f2afd40c6d8', // HO4D8
  'dfb9abfc13019e6cacf62fbb05c1fdbe426cdc0077c12e47f2ea37f26fe1805d', // CY4ZE
  '2c55f62db25df18741615dd8ad5a1a1ff7f782a4b38634e87e299f32fad2abf4', // W5LG6
  'a9924467ee95d453c92c8f00d067bebebd0e4dfb9d19107d0db279c6bdd95f83', // JZWDP
  '3c0da4409865d3e68cd5e8441235058c79189718b28376acba78f263e3bc67f0', // LUEGV
  '0a98876c16f588454504898947320211d856a2436427924dc34daf878430ec66', // 9PFZR
  'c0a790850520a73ce2dcdb272ec915910a0d100ba29e312324faa1deff2e49f9', // QHKUW
  '671d32da8d1dc2e811c22271ef87919c1f311b766853179754ad2755d4a37bbe', // 3XC35
  'a5d8f2e40a17f669a31c5e149d20472155e3c27dfd6973fedd9ffa7a96667fdf', // H64N3
  '78bcb55f99a6f10e3ce64dc057b8941cfff47345a0adcfa5ea7c98a1aa2585d4', // 4WDC6
]);

const SUPPORT_EMAIL = 'support@hodlhunt.io';

const strings: Record<Lang, { title: string; placeholder: string; button: string; error: string; footer1: string; footer2: string; hint: string; supportLabel: string }> = {
  ru: {
    title: 'HODL HUNT',
    placeholder: 'Введите код доступа',
    button: 'Войти',
    error: 'Неверный код',
    footer1: '© HODL HUNT',
    footer2: 'Solana • On-chain PvP',
    hint: 'Альфа-доступ: введите код для входа',
    supportLabel: 'Поддержка:',
  },
  en: {
    title: 'HODL HUNT',
    placeholder: 'Enter access code',
    button: 'Enter',
    error: 'Invalid code',
    footer1: '© HODL HUNT',
    footer2: 'Solana • On-chain PvP',
    hint: 'Alpha access: enter the code to continue',
    supportLabel: 'Contact us:',
  },
};

async function sha256Hex(str: string) {
  const enc = new TextEncoder();
  const buf = enc.encode(str);
  const digest = await crypto.subtle.digest('SHA-256', buf);
  const arr = Array.from(new Uint8Array(digest));
  return arr.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export const AlphaGate: React.FC<{ onSuccess: () => void; language?: Lang }> = ({ onSuccess, language = 'ru' }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const t = useMemo(() => strings[language] || strings.ru, [language]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const flag = window.localStorage.getItem(STORAGE_KEY);
    if (flag === 'ok') {
      onSuccess();
    }
  }, [onSuccess]);

  const check = useCallback(async () => {
    try {
      const hash = await sha256Hex(code.trim().toUpperCase() + SALT);
      if (ALLOWED_HASHES.has(hash)) {
        window.localStorage.setItem(STORAGE_KEY, 'ok');
        onSuccess();
      } else {
        setError(t.error);
        setCode('');
        setTimeout(() => setError(null), 2000);
      }
    } catch {
      setError(t.error);
    }
  }, [code, onSuccess, t.error]);

  const onSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    void check();
  }, [check]);

  return (
    <div className="alpha-root">
      <div className="alpha-rays" />
      <div className="alpha-horizon" />
      <div className="alpha-wrap">
        <main className="alpha-hero">
          <h1 className="alpha-brand">{t.title}</h1>
          <section className="alpha-gate">
            <form onSubmit={onSubmit} autoComplete="off">
              <div className="alpha-row">
                <input
                  className="alpha-input"
                  type="password"
                  placeholder={t.placeholder}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  autoFocus
                />
                <button className="alpha-btn" type="submit">{t.button}</button>
              </div>
              <div className="alpha-err">{error || t.hint}</div>
              <div className="alpha-support">
                <span>{t.supportLabel}</span>{' '}
                <a href={`mailto:${SUPPORT_EMAIL}`} className="alpha-support-link" rel="noopener noreferrer">{SUPPORT_EMAIL}</a>
              </div>
              <div className="alpha-fine">
                <span>{t.footer1}</span>
                <span>{t.footer2}</span>
              </div>
            </form>
          </section>
        </main>
      </div>
      <div className="alpha-waves">
        <svg viewBox="0 0 1440 420" preserveAspectRatio="none">
          <path d="M0,260 C180,220 360,300 540,270 C720,240 900,170 1080,210 C1260,250 1350,310 1440,290 L1440,420 L0,420 Z"
            fill="rgba(11,141,255,.18)"></path>
          <path d="M0,300 C220,340 380,260 560,290 C740,320 920,380 1100,345 C1280,310 1370,250 1440,275 L1440,420 L0,420 Z"
            fill="rgba(9,183,255,.12)"></path>
        </svg>
      </div>
    </div>
  );
};

export default AlphaGate;
