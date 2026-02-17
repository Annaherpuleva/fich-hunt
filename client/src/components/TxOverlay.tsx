import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { toast } from '../lib/toast';
import FishActionModal, { FishActionBiteChildren, FishActionFeedChildren, FishActionMarkChildren } from '../features/fish/components/FishActionModal';
import cryptofishIdl from '../idl/cryptofish.json';

type TxEntityContext = {
  fishId?: number;
  name?: string;
  valueText?: string;
  avatarUrl?: string | null;
  feedDeltaSol?: number;
  feedPercent?: number;
  huntGainSol?: number;
  recipient?: string;
  payoutSol?: number;
};

type RunTxOptions = {
  actionText?: string;
  showSuccessModal?: boolean; // default true
  showErrorModal?: boolean;   // default true
  entity?: TxEntityContext;   // optional context about the entity (e.g. fish) involved in tx
  successKind?: 'default' | 'feed' | 'revive' | 'mark' | 'hunt' | 'gift' | 'sell';
};

type TxContextValue = {
  running: boolean;
  text?: string;
  runTx: <T>(fn: () => Promise<T>, label?: string, options?: RunTxOptions) => Promise<T>;
  // simple pub-sub per session
  lastTx?: { signature?: string; ok: boolean; actionText?: string } | null;
};

const TxContext = createContext<TxContextValue | null>(null);

export const useTx = () => {
  const ctx = useContext(TxContext);
  if (!ctx) throw new Error('useTx must be used within TxProvider');
  return ctx;
};

type RetryCtx = {
  fn: () => Promise<any>;
  label?: string;
  options?: RunTxOptions;
};

export const TxProvider: React.FC<{ children: React.ReactNode }>=({ children })=>{
  const [running, setRunning] = useState(false);
  const [text, setText] = useState<string | undefined>(undefined);
  // const [cluster, setCluster] = useState<string>('devnet');
  const [modal, setModal] = useState<{ open: boolean; ok: boolean; signature?: string; error?: string; actionText?: string; entity?: TxEntityContext; successKind?: 'default' | 'feed' | 'revive' | 'mark' | 'hunt' | 'gift' | 'sell' } | null>(null);
  const [lastTx, setLastTx] = useState<{ signature?: string; ok: boolean; actionText?: string } | null>(null);
  const [retryCtx, setRetryCtx] = useState<RetryCtx | null>(null);
  // Prevent concurrent or duplicate runTx executions by returning the in-flight promise
  const inFlightRef = useRef<Promise<any> | null>(null);

  // useEffect(() => {
  //   (async () => {
  //     try {
  //       const cfg = await loadRuntimeConfig();
  //       if (cfg?.CLUSTER) setCluster(cfg.CLUSTER);
  //     } catch (_) {}
  //   })();
  // }, []);

  const { t, language } = useLanguage();
  const anchorErrorMap = useMemo(() => {
    const raw = (cryptofishIdl as any)?.errors as { code: number; name: string; msg: string }[] | undefined;
    const byCode: Record<number, { name: string; msg: string }> = {};
    const byName: Record<string, { code: number; msg: string }> = {};
    (raw || []).forEach((e) => {
      byCode[e.code] = { name: e.name, msg: e.msg };
      byName[e.name] = { code: e.code, msg: e.msg };
    });
    return { byCode, byName };
  }, []);

  const getHumanError = useCallback(
    (raw: string | undefined): string => {
      if (!raw) {
        return language === 'ru'
          ? 'Произошла ошибка при выполнении транзакции. Попробуйте ещё раз.'
          : 'An error occurred while processing the transaction. Please try again.';
      }

      // Try to detect Anchor error format: Error Code / Error Number / Error Message
      const codeMatch = raw.match(/Error Code:\s*([A-Za-z0-9_]+)/);
      const numMatch = raw.match(/Error Number:\s*(\d{4})/);
      const msgMatch = raw.match(/Error Message:\s*([^.]+(?:\.[^A]|$))/);

      const codeName = codeMatch?.[1];
      const codeNum = numMatch ? Number(numMatch[1]) : undefined;

      let idlMsg: string | undefined;
      if (codeNum != null && anchorErrorMap.byCode[codeNum]) {
        idlMsg = anchorErrorMap.byCode[codeNum].msg;
      } else if (codeName && anchorErrorMap.byName[codeName]) {
        idlMsg = anchorErrorMap.byName[codeName].msg;
      } else if (msgMatch) {
        idlMsg = msgMatch[1].trim();
      }

      // Localized mapping by code/name when we care about UX
      const localizedByCode: Record<number, { ru: string; en: string }> = {
        6000: {
          ru: 'Минимальный депозит 0.01 TON.',
          en: 'Minimum deposit is 0.01 TON.',
        },
        6001: {
          ru: 'Слишком длинное имя жителя — максимум 32 символа.',
          en: 'Fish name is too long — maximum 32 characters.',
        },
        6002: {
          ru: 'Некорректное имя жителя. Используйте только латинские буквы и цифры.',
          en: 'Invalid fish name. Use only Latin letters and numbers.',
        },
        6003: {
          ru: 'Такое имя жителя уже занято. Попробуйте другое имя.',
          en: 'This fish name is already taken. Please choose another one.',
        },
        6004: {
          // UnauthorizedAdmin
          ru: 'Недостаточно прав для выполнения этого админ-действия.',
          en: 'Unauthorized admin action',
        },
        6005: {
          // NotFishOwner
          ru: 'Вы не являетесь владельцем этого жителя.',
          en: 'Caller is not the fish owner',
        },
        6006: {
          // FishAlreadyDead
          ru: 'Этот житель уже мертв.',
          en: 'Fish is already dead',
        },
        6007: {
          // CannotTransferToSelf
          ru: 'Нельзя передать жителя самому себе.',
          en: 'Cannot transfer fish to yourself',
        },
        6008: {
          ru: 'Недостаточная сумма кормления. Увеличьте депозит и попробуйте ещё раз.',
          en: 'Insufficient feeding amount. Increase the deposit and try again.',
        },
        6009: {
          ru: 'Недостаточно средств на кошельке для выполнения транзакции. Учтите, что комиссия начисляется сверх стоимости кормления. Вашего текущего баланса не хватает для покрытия полной суммы.',
          en: 'Insufficient funds in your wallet to complete the transaction. Please note that the fee is charged on top of the feeding amount. Your current balance is not enough to cover the total cost.',
        },
        6010: {
          ru: 'Эта добыча слишком тяжёлая для вашего жителя.',
          en: 'This prey is too heavy for your fish.',
        },
        6011: {
          ru: 'Житель ещё на кулдауне после предыдущей охоты. Подождите немного и попробуйте ещё раз.',
          en: 'Your fish is still on hunting cooldown. Please wait a bit and try again.',
        },
        6012: {
          ru: 'Эта цель сейчас недоступна для укуса.',
          en: 'This prey is not valid for hunting right now.',
        },
        6013: {
          ru: 'Вес добычи слишком изменился. Обновите страницу и попробуйте ещё раз.',
          en: 'Prey weight changed too much. Refresh the page and try again.',
        },
        6014: {
          ru: 'Превышен лимит меток для текущего периода океана.',
          en: 'You have reached the hunting mark limit for the current ocean period.',
        },
        6015: {
          // MarkTooEarly
          ru: 'Слишком рано для постановки метки. Можно только в последние 3 часа до голода.',
          en: 'Too early to place hunting mark (must be within 3 hours of hunger)',
        },
        6016: {
          // MarkInactive
          ru: 'Эта метка сейчас неактивна.',
          en: 'Hunting mark is inactive',
        },
        6017: {
          // MarkWrongHunter
          ru: 'Неверный житель-охотник для этой метки.',
          en: 'Wrong hunter for this mark',
        },
        6018: {
          // MarkWrongPrey
          ru: 'Неверная жертва для этой метки.',
          en: 'Wrong prey for this mark',
        },
        6019: {
          ru: 'Срок действия этой метки истёк.',
          en: 'This hunting mark has expired.',
        },
        6020: {
          // MarkExclusivityActive
          ru: 'Сейчас действует период эксклюзивной охоты по этой метке — охотиться может только владелец метки.',
          en: 'Mark exclusivity period active - only mark owner can hunt',
        },
        6021: {
          // MarkAlreadyActive
          ru: 'На этом жителе уже есть активная метка.',
          en: 'An active hunting mark already exists on this fish.',
        },
        6022: {
          // ExitDuringStorm
          ru: 'Нельзя выйти из игры во время шторма.',
          en: 'Cannot exit during storm',
        },
      };

      let localized: string | undefined;
      if (codeNum != null && localizedByCode[codeNum]) {
        localized = language === 'ru' ? localizedByCode[codeNum].ru : localizedByCode[codeNum].en;
      }

      if (!localized && idlMsg) {
        localized = idlMsg;
      }

      if (localized) return localized;

      // Fallback: short generic text, without full debug
      return language === 'ru'
        ? 'Что-то пошло не так при выполнении транзакции. Попробуйте ещё раз.'
        : 'Something went wrong while processing the transaction. Please try again.';
    },
    [anchorErrorMap, language, t],
  );
  const runTx = useCallback(async <T,>(fn: () => Promise<T>, label?: string, options?: RunTxOptions) => {
    if (inFlightRef.current) {
      return inFlightRef.current as Promise<T>;
    }
    const p = (async () => {
      setText(label);
      setRunning(true);
      try {
        const res = await fn();
        // if transaction returns signature string, show success modal
        const sig = typeof res === 'string' ? String(res) : undefined;
        const isDuplicate = !!(lastTx?.ok && lastTx?.signature && sig && lastTx.signature === sig);
        if (!isDuplicate) {
          if (options?.showSuccessModal !== false) {
            setModal({
              open: true,
              ok: true,
              signature: sig,
              actionText: options?.actionText,
              entity: options?.entity,
              successKind: options?.successKind ?? 'default',
            });
          }
          if (options?.actionText) {
            toast.success(`${options.actionText}: ${t.tx.successTitle.toLowerCase()}${sig ? ` (${sig.slice(0, 8)}...)` : ''}`);
          }
          setLastTx({ signature: sig, ok: true, actionText: options?.actionText });
        }
        return res;
      } catch (e: any) {
        // Готовим текст для парсинга: пытаемся извлечь коды из логов и meta
        const meta =
          (e?.transactionResponse && e.transactionResponse.meta) ||
          (e?.data && e.data.meta) ||
          e?.meta ||
          undefined;

        const logs: string[] =
          (Array.isArray(e?.logs) && e.logs) ||
          (Array.isArray(meta?.logMessages) && meta.logMessages) ||
          (Array.isArray(meta?.logs) && meta.logs) ||
          [];

        let rawError = e?.message || String(e);
        if (!rawError && logs.length) {
          rawError = logs.join('\n');
        }

        // Некоторые ошибки TON/Anchor приходят как { InstructionError: [idx, { Custom: 6010 }] }
        // (даже если message — строка вроде "SendTransactionError: Unknown action 'undefined'").
        // В таком случае вытаскиваем код и конструируем строку "Error Number: 6010",
        // чтобы getHumanError смог сопоставить её с IDL и локализованными текстами.
        let fromInstruction: string | undefined;
        const tryExtractInstruction = (src: any) => {
          const inst = src?.InstructionError;
          if (Array.isArray(inst) && inst.length >= 2 && inst[1] && typeof inst[1].Custom === 'number') {
            const customCode = Number(inst[1].Custom);
            if (Number.isFinite(customCode)) {
              const codeStr = customCode.toString().padStart(4, '0');
              fromInstruction = `Error Number: ${codeStr}`;
            }
          }
        };
        if (e && typeof e === 'object') {
          tryExtractInstruction((e as any).InstructionError ? (e as any) : (e as any));
          tryExtractInstruction(e?.err);
          tryExtractInstruction(meta?.err);
        }

        // Дополнительно парсим hex-код custom program error вида "custom program error: 0x177b"
        if (!fromInstruction && typeof rawError === 'string') {
          const hexMatch = rawError.match(/custom program error:\s*0x([0-9a-fA-F]+)/);
          if (hexMatch) {
            const num = parseInt(hexMatch[1], 16);
            if (Number.isFinite(num)) {
              const codeStr = num.toString().padStart(4, '0');
              fromInstruction = `Error Number: ${codeStr}`;
            }
          }
        }

        const logJoined = logs.length ? logs.join('\n') : undefined;
        const humanError = getHumanError(fromInstruction || logJoined || rawError);
        // Сохраняем контекст для повторной попытки
        setRetryCtx({ fn, label, options });
        if (options?.showErrorModal !== false) {
          setModal({
            open: true,
            ok: false,
            error: humanError,
            actionText: options?.actionText,
            entity: options?.entity,
          });
        }
        if (options?.actionText) {
          toast.error(`${options.actionText}: ${humanError}`);
        }
        setLastTx({ signature: undefined, ok: false, actionText: options?.actionText });
        // Не выбрасываем ошибку дальше, чтобы не ломать UI и не вызывать React error overlay.
        return undefined as any;
      } finally {
        setRunning(false);
        setText(undefined);
      }
    })();
    inFlightRef.current = p;
    try {
      const result = await p;
      return result as T;
    } finally {
      inFlightRef.current = null;
    }
  }, [getHumanError, lastTx]);

  const handleRetry = useCallback(() => {
    if (!retryCtx) return;
    const { fn, label, options } = retryCtx;
    setModal(null);
    // Запускаем ту же транзакцию ещё раз
    runTx(fn, label, options).catch(() => {
      // ошибка уже будет показана через тот же механизм
    });
  }, [retryCtx, runTx]);

  // В модалках всегда стараемся показывать тумбсы из /thumbs, а не полный аватар.


  const txStatusChain = language === 'ru'
    ? ['ожидает подтверждения', 'подтверждено в сети', 'зачислено backend']
    : ['pending confirmation', 'confirmed on network', 'credited by backend'];

  const TxStatusChain = () => (
    <div className="mt-3 rounded-lg border border-white/10 bg-black/20 p-3">
      <div className="text-[12px] uppercase tracking-wide text-white/60 mb-1">
        {language === 'ru' ? 'Статус обработки' : 'Processing status'}
      </div>
      <div className="text-[13px] text-white/90">
        {txStatusChain.join(' → ')}
      </div>
    </div>
  );

  const getThumbAvatar = useCallback((url?: string | null): string | undefined => {
    if (!url) return undefined;
    if (url.includes('/static/avatars/thumbs/')) return url;
    if (url.includes('/static/avatars/')) {
      const withThumb = url.replace('/static/avatars/', '/static/avatars/thumbs/');
      return withThumb.replace(/\.[^.?#]+(?=($|[?#]))/, '.webp');
    }
    return url;
  }, []);

  const value = useMemo(() => ({ running, text, runTx, lastTx }), [running, text, runTx, lastTx]);
  return (
    <TxContext.Provider value={value}>
      {children}
      {running && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-[#1C1B20] border border-[#2A2A2E] rounded-xl p-6 w-[320px] text-center">
            <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            <div className="text-white text-sm">{text || t.tx.processing}</div>
          </div>
        </div>
      )}
      {modal?.open && modal.ok && modal.successKind === 'default' && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-[#1C1B20] border border-[#2A2A2E] rounded-xl p-6 w-[420px] text-left">
            <div className="text-lg font-semibold text-green-400">
              {t.tx.successTitle}
            </div>
            {modal.actionText && (
              <div className="mt-1 text-white/90 text-sm">
                {modal.actionText}
                {t.tx.actionDone}
              </div>
            )}
            {modal.signature && (
              <div className="mt-3 text-white/90 text-sm break-all">
                <div>{t.tx.signature}:</div>
                <a
                  className="text-blue-400 underline"
                  href={`https://tonscan.org/tx/${modal.signature}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {modal.signature}
                </a>
              </div>
            )}
            <TxStatusChain />
            <div className="mt-4 flex justify-end">
              <button className="btn-primary" onClick={() => setModal(null)}>
                {t.tx.close}
              </button>
            </div>
          </div>
        </div>
      )}
      {modal?.open && modal.ok && modal.successKind === 'feed' && (
        <FishActionModal
          open
          onClose={() => setModal(null)}
          confirmLabel={language === 'ru' ? 'Открыть транзакцию' : 'Open transaction'}
          cancelLabel={language === 'ru' ? 'Закрыть' : 'Close'}
          onConfirm={() => {
            if (!modal.signature) {
              setModal(null);
              return;
            }
            const url = `https://tonscan.org/tx/${modal.signature}`;
            window.open(url, '_blank', 'noopener,noreferrer');
          }}
          background="/img/ocean-background.png"
          imageSrc={getThumbAvatar(modal.entity?.avatarUrl) || '/img/fish-img-3-858cfd.png'}
          fishName={modal.entity?.name || ''}
          fishValueText={modal.entity?.valueText}
        >
          <FishActionFeedChildren feedDelta={modal.entity?.feedDeltaSol} />
          <TxStatusChain />
        </FishActionModal>
      )}
      {modal?.open && modal.ok && modal.successKind === 'revive' && (
        <FishActionModal
          open
          onClose={() => setModal(null)}
          confirmLabel={language === 'ru' ? 'Открыть транзакцию' : 'Open transaction'}
          cancelLabel={language === 'ru' ? 'Закрыть' : 'Close'}
          onConfirm={() => {
            if (!modal.signature) {
              setModal(null);
              return;
            }
            const url = `https://tonscan.org/tx/${modal.signature}`;
            window.open(url, '_blank', 'noopener,noreferrer');
          }}
          background="/img/ocean-background.png"
          imageSrc={getThumbAvatar(modal.entity?.avatarUrl) || '/img/fish-img-3-858cfd.png'}
          fishName={modal.entity?.name || ''}
          fishValueText={modal.entity?.valueText}
        >
          <div className="text-[#DEDEDE] text-[14px] sm:text-[16px] leading-[1.4] tracking-[-0.03em] font-bold">
            {language === 'ru'
              ? 'Вы удачно возродили жителя с новым именем.'
              : 'You have successfully resurrected your creature with a new name.'}
          </div>
          <TxStatusChain />
        </FishActionModal>
      )}
      {modal?.open && modal.ok && modal.successKind === 'mark' && (
        <FishActionModal
          open
          onClose={() => setModal(null)}
          confirmLabel={language === 'ru' ? 'К другим жителям' : 'Back to fish'}
          cancelLabel={language === 'ru' ? 'Закрыть' : 'Close'}
          onConfirm={() => setModal(null)}
          background="/img/tx-error-bg.png"
          imageSrc={getThumbAvatar(modal.entity?.avatarUrl) || '/img/fish-img-3-858cfd.png'}
          fishName={modal.entity?.name || ''}
          fishValueText={modal.entity?.valueText}
        >
          <FishActionMarkChildren />
          <TxStatusChain />
        </FishActionModal>
      )}
      {modal?.open && modal.ok && modal.successKind === 'hunt' && (
        <FishActionModal
          open
          onClose={() => setModal(null)}
          confirmLabel={language === 'ru' ? 'Открыть транзакцию' : 'Open transaction'}
          cancelLabel={language === 'ru' ? 'К списку жертв' : 'Back to victims'}
          onConfirm={() => {
            if (!modal.signature) {
              setModal(null);
              return;
            }
            const url = `https://tonscan.org/tx/${modal.signature}`;
            window.open(url, '_blank', 'noopener,noreferrer');
          }}
          background="/img/tx-error-bg.png"
          imageSrc={getThumbAvatar(modal.entity?.avatarUrl) || '/img/fish-img-3-858cfd.png'}
          fishName={modal.entity?.name || ''}
          fishValueText={modal.entity?.valueText}
        >
          <FishActionBiteChildren gain={modal.entity?.huntGainSol} />
          <TxStatusChain />
        </FishActionModal>
      )}
      {modal?.open && modal.ok && modal.successKind === 'gift' && (
        <FishActionModal
          open
          onClose={() => {
            setModal(null);
            window.location.reload();
          }}
          confirmLabel={language === 'ru' ? 'Открыть транзакцию' : 'Open transaction'}
          cancelLabel={language === 'ru' ? 'Закрыть' : 'Close'}
          onConfirm={() => {
            if (!modal.signature) {
              setModal(null);
              window.location.reload();
              return;
            }
            const url = `https://tonscan.org/tx/${modal.signature}`;
            window.open(url, '_blank', 'noopener,noreferrer');
            setModal(null);
            window.location.reload();
          }}
          background="/img/ocean-background.png"
          imageSrc={getThumbAvatar(modal.entity?.avatarUrl) || '/img/fish-img-3-858cfd.png'}
          fishName={modal.entity?.name || ''}
          fishValueText={modal.entity?.valueText}
        >
          <div className="text-[#DEDEDE] text-[14px] sm:text-[16px] leading-[1.4] tracking-[-0.03em] space-y-2">
            <TxStatusChain />
            <p className="font-bold">
              {language === 'ru' ? 'Житель отправлен на адрес' : 'The creature has been sent to address'}
            </p>
            {modal.entity?.recipient && (
              <button
                type="button"
                onClick={() => {
                  const addr = modal.entity?.recipient;
                  if (!addr) return;
                  const url = `https://tonscan.org/address/${addr}`;
                  window.open(url, '_blank', 'noopener,noreferrer');
                }}
                className="w-full rounded-[12px] bg-black/40 border border-white/10 px-3 py-2 text-left hover:bg-black/60 transition-colors"
              >
                <span className="block font-mono text-[13px] sm:text-[14px] text-[#DEDEDE] truncate">
                  {modal.entity.recipient}
                </span>
              </button>
            )}
          </div>
        </FishActionModal>
      )}
      {modal?.open && modal.ok && modal.successKind === 'sell' && (
        <FishActionModal
          open
          onClose={() => {
            setModal(null);
          }}
          confirmLabel={language === 'ru' ? 'Открыть транзакцию' : 'Open transaction'}
          cancelLabel={language === 'ru' ? 'Закрыть' : 'Close'}
          onConfirm={() => {
            if (!modal.signature) {
              setModal(null);
              return;
            }
            const url = `https://tonscan.org/tx/${modal.signature}`;
            window.open(url, '_blank', 'noopener,noreferrer');
            setModal(null);
          }}
          background="/img/ocean-background.png"
          imageSrc={getThumbAvatar(modal.entity?.avatarUrl) || '/img/fish-img-3-858cfd.png'}
          fishName={modal.entity?.name || ''}
          fishValueText={modal.entity?.valueText}
        >
          <div className="text-[#DEDEDE] text-[14px] sm:text-[16px] leading-[1.4] tracking-[-0.03em] space-y-1">
            <TxStatusChain />
            {(() => {
              const payout = modal.entity?.payoutSol;
              if (typeof payout === 'number' && Number.isFinite(payout) && payout > 0) {
                const payoutText = payout.toFixed(6);
                return (
                  <p>
                    {language === 'ru'
                      ? <><b>Ваш житель продан</b><br />После вычета комиссий вы получили {payoutText} TON.</>
                      : <><b>Your creature has been sold</b><br />After fees, you received {payoutText} TON.</>}
                  </p>
                );
              }
              return (
                <p>
                  {language === 'ru'
                    ? <><b>Ваш житель продан</b><br/>Средства успешно зачислены.</>
                    : <><b>Your creature has been sold</b><br/>Funds have been credited successfully.</>}
                </p>
              );
            })()}
          </div>
        </FishActionModal>
      )}
      {modal?.open && !modal.ok && (
        <FishActionModal
          open
          onClose={() => setModal(null)}
          confirmLabel={language === 'ru' ? 'Повторить попытку' : 'Try again'}
          cancelLabel={language === 'ru' ? 'Отменить' : 'Cancel'}
          onConfirm={handleRetry}
          background="/img/tx-error-bg.png"
          imageSrc={getThumbAvatar(modal.entity?.avatarUrl) || "/img/dead-fish.png"}
          fishName={modal.entity?.name || (t.tx.errorTitle)}
          fishValueText={modal.entity?.valueText}
        >
          <div className="text-white/90 text-[14px] leading-[1.4] tracking-[-0.03em] space-y-2">
            {modal.actionText && (
              <p className="font-sf-pro-display font-bold">
                {modal.actionText}
                {t.tx.actionFailed}
              </p>
            )}

            {modal.error && (
              <p className="text-[#DEDEDE] whitespace-pre-wrap break-words">
                {modal.error}
              </p>
            )}
          </div>
        </FishActionModal>
      )}
    </TxContext.Provider>
  );
};
