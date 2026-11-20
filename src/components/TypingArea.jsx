import React, { useRef, useState, useLayoutEffect, useEffect, memo } from 'react';
import { Globe, Check } from 'lucide-react';
import { LANGUAGES } from '../data/words.js';
import { FONT_SIZES, TYPING_FONTS } from '../utils/storage.js';

const WordItem = memo(function WordItem({ target, typed, isCurrent, wordIndex }) {
  const targetChars = target.split('');
  const typedChars = (typed || '').split('');
  const extraChars =
    typedChars.length > targetChars.length ? typedChars.slice(targetChars.length) : [];

  return (
    <span
      data-word-index={wordIndex}
      className="inline-block mr-[0.55em] mb-[0.22em] select-none"
    >
      {targetChars.map((ch, cIdx) => {
        const typedCh = typedChars[cIdx];
        let colorClass = 'text-[var(--tf-text-dim)]';
        if (typedCh !== undefined) {
          colorClass =
            typedCh === ch
              ? 'text-[var(--tf-text)]'
              : 'text-[var(--tf-error)] underline decoration-[var(--tf-error)]/60 underline-offset-4';
        }
        return (
          <span
            key={cIdx}
            data-char-index={cIdx}
            className={`inline-block transition-colors duration-75 ${colorClass}`}
          >
            {ch}
          </span>
        );
      })}
      {extraChars.map((ch, eIdx) => {
        const cIdx = targetChars.length + eIdx;
        return (
          <span
            key={`extra-${eIdx}`}
            data-char-index={cIdx}
            className="inline-block text-[var(--tf-error-extra)] opacity-90 underline decoration-[var(--tf-error-extra)]/70 underline-offset-4"
          >
            {ch}
          </span>
        );
      })}
      {isCurrent && (
        <span
          data-word-end="true"
          className="inline-block w-0"
          aria-hidden="true"
        >
          &#8203;
        </span>
      )}
    </span>
  );
});

export default function TypingArea({
  words,
  typedWords,
  currentWordIndex,
  status,
  mode,
  language,
  quoteMeta,
  fontFamily,
  fontSize,
  smoothCaret,
  onInputChar,
  onBackspace,
  onRestart,
  onFinishZen,
  modalOpen,
}) {
  const inputRef = useRef(null);
  const wordsInnerRef = useRef(null);
  const [isFocused, setIsFocused] = useState(true);
  const [caretPos, setCaretPos] = useState({ x: 0, y: 0, height: 28, visible: false });
  const [scrollY, setScrollY] = useState(0);
  const [layoutTick, setLayoutTick] = useState(0);

  useEffect(() => {
    const onResize = () => setLayoutTick((t) => t + 1);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const fontCfg = TYPING_FONTS.find((f) => f.id === fontFamily) || TYPING_FONTS[0];
  const sizeCfg = FONT_SIZES.find((s) => s.id === fontSize) || FONT_SIZES[1];
  const langLabel =
    mode === 'quote'
      ? quoteMeta?.author
        ? `quote · ${quoteMeta.author}`
        : 'quote'
      : mode === 'custom'
      ? 'custom passage'
      : (LANGUAGES.find((l) => l.id === language)?.label || language).toLowerCase();

  const focusInput = () => {
    if (modalOpen) return;
    if (inputRef.current) {
      inputRef.current.focus({ preventScroll: true });
      setIsFocused(true);
    }
  };

  // Keep hidden input focused when starting or clicking outside modals
  useEffect(() => {
    if (!modalOpen) {
      focusInput();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalOpen, words]);

  // Global keydown listener to auto-focus typing area when user starts typing on Practice page
  useEffect(() => {
    const handleGlobalKey = (e) => {
      if (modalOpen) return;
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
        if (document.activeElement === inputRef.current) return;
        return;
      }
      if (e.key === 'Tab') {
        e.preventDefault();
        onRestart();
        focusInput();
        return;
      }
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        focusInput();
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalOpen, onRestart]);

  // Recalculate caret coordinates and 3-line scroll window
  useLayoutEffect(() => {
    const container = wordsInnerRef.current;
    if (!container) return;

    const activeWordEl = container.querySelector(`[data-word-index="${currentWordIndex}"]`);
    if (!activeWordEl) {
      setCaretPos((prev) => ({ ...prev, visible: false }));
      return;
    }

    const typedLen = (typedWords[currentWordIndex] || '').length;
    const targetCharEl = activeWordEl.querySelector(`[data-char-index="${typedLen}"]`);

    let x = 0;
    let y = activeWordEl.offsetTop;
    let height = activeWordEl.offsetHeight * 0.78;

    if (targetCharEl) {
      x = targetCharEl.offsetLeft;
      y = targetCharEl.offsetTop;
      height = targetCharEl.offsetHeight * 0.88;
    } else {
      const endMarker = activeWordEl.querySelector('[data-word-end="true"]');
      if (endMarker) {
        x = endMarker.offsetLeft;
        y = endMarker.offsetTop;
        height = endMarker.offsetHeight * 0.88;
      } else {
        x = activeWordEl.offsetLeft + activeWordEl.offsetWidth;
      }
    }

    setCaretPos({ x, y, height: Math.max(20, height), visible: true });

    // Compute line height in pixels to keep active line in middle of 3-line viewport
    const computedLineHeight =
      parseFloat(window.getComputedStyle(container).lineHeight) || 42;
    if (y > computedLineHeight * 1.35) {
      setScrollY(Math.max(0, y - computedLineHeight));
    } else {
      setScrollY(0);
    }
  }, [currentWordIndex, typedWords, words, fontSize, fontFamily, layoutTick]);

  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      onRestart();
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      if (mode === 'zen' && status === 'running') {
        onFinishZen();
      } else {
        inputRef.current?.blur();
      }
      return;
    }
    if (e.key === 'Backspace') {
      e.preventDefault();
      onBackspace(e.ctrlKey || e.metaKey || e.altKey);
      return;
    }
    if (e.key === ' ') {
      e.preventDefault();
      onInputChar(' ');
      return;
    }
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
    }
  };

  const handleChange = (e) => {
    const val = e.target.value;
    if (!val) return;
    e.target.value = '';
    for (const ch of val) {
      onInputChar(ch);
    }
  };

  // Visible height corresponds to roughly 3 lines of text
  const viewportHeight = `calc(${sizeCfg.lineHeight} * 3 + 0.6rem)`;

  return (
    <div className="w-full flex flex-col">
      {/* Main Typing Canvas */}
      <div
        onClick={focusInput}
        className="relative w-full cursor-text rounded-xl py-2"
        style={{ height: viewportHeight, overflow: 'hidden' }}
      >
        <input
          ref={inputRef}
          type="text"
          aria-label="Typing input"
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck="false"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          onChange={handleChange}
          className="absolute opacity-0 w-px h-px pointer-events-none top-4 left-4"
        />

        {/* Words Container */}
        <div
          ref={wordsInnerRef}
          className={`relative font-typing transition-all duration-150 ${
            !isFocused && status !== 'finished' ? 'blur-[3px] opacity-40' : 'blur-0 opacity-100'
          }`}
          style={{
            fontFamily: fontCfg.stack,
            fontSize: sizeCfg.px,
            lineHeight: sizeCfg.lineHeight,
            transform: `translate3d(0, -${scrollY}px, 0)`,
          }}
        >
          {/* Animated Caret */}
          {caretPos.visible && isFocused && (
            <span
              aria-hidden="true"
              className={`absolute left-0 top-0 w-[2.5px] rounded-full bg-[var(--tf-accent)] pointer-events-none z-10 ${
                status === 'idle' ? 'tf-caret-blink' : ''
              }`}
              style={{
                height: `${caretPos.height}px`,
                transform: `translate3d(${caretPos.x}px, ${caretPos.y + 4}px, 0)`,
                transition: smoothCaret
                  ? 'transform 85ms cubic-bezier(0.16, 1, 0.3, 1)'
                  : 'none',
              }}
            />
          )}

          {words.map((word, idx) => (
            <WordItem
              key={`${idx}-${word}`}
              wordIndex={idx}
              target={word}
              typed={idx <= currentWordIndex ? typedWords[idx] || '' : ''}
              isCurrent={idx === currentWordIndex}
            />
          ))}
        </div>

        {/* Click-to-focus overlay */}
        {!isFocused && status !== 'finished' && (
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <span className="px-4 py-2 rounded-lg bg-[var(--tf-surface)]/95 border border-[var(--tf-border)] text-sm font-medium text-[var(--tf-text)] shadow-sm">
              Click or press any key to resume typing
            </span>
          </div>
        )}
      </div>

      {/* Zen mode finish action */}
      {mode === 'zen' && status === 'running' && (
        <div className="mt-5">
          <button
            type="button"
            onClick={onFinishZen}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--tf-surface)] border border-[var(--tf-border)] text-xs font-medium text-[var(--tf-text)] hover:border-[var(--tf-accent)] transition-colors cursor-pointer"
          >
            <Check className="w-3.5 h-3.5 text-[var(--tf-accent)]" />
            <span>Finish Zen session (Esc)</span>
          </button>
        </div>
      )}
    </div>
  );
}
