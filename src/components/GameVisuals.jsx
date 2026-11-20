import { motion } from 'motion/react';
import { TF_EASE } from '../utils/motion.js';

/**
 * Lightweight, custom geometric SVG emblems & arena visuals aligned with Typisst's palette.
 */

export function GameEmblem({ gameId, className = 'w-10 h-10' }) {
  if (gameId === 'falling-words') {
    return (
      <svg viewBox="0 0 40 40" fill="none" className={className} aria-hidden="true">
        <rect x="6" y="7" width="12" height="3.5" rx="1.5" fill="var(--tf-text-dim)" />
        <rect x="20" y="13" width="14" height="3.5" rx="1.5" fill="var(--tf-accent)" />
        <rect x="9" y="21" width="10" height="3.5" rx="1.5" fill="var(--tf-text-muted)" />
        <path
          d="M27 19V27M27 27L24 24M27 27L30 24"
          stroke="var(--tf-accent)"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <line x1="5" y1="33" x2="35" y2="33" stroke="var(--tf-border)" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  if (gameId === 'word-sprint') {
    return (
      <svg viewBox="0 0 40 40" fill="none" className={className} aria-hidden="true">
        <path
          d="M7 14H22M11 20H30M7 26H19"
          stroke="var(--tf-text-muted)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M25 12L33 20L25 28"
          stroke="var(--tf-accent)"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (gameId === 'survival-mode') {
    return (
      <svg viewBox="0 0 40 40" fill="none" className={className} aria-hidden="true">
        <path
          d="M20 6L31 10.5V19.5C31 26.2 26.3 31.4 20 34C13.7 31.4 9 26.2 9 19.5V10.5L20 6Z"
          stroke="var(--tf-border)"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M15.5 20L18.5 23L25 16.5"
          stroke="var(--tf-accent)"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (gameId === 'accuracy-challenge') {
    return (
      <svg viewBox="0 0 40 40" fill="none" className={className} aria-hidden="true">
        <circle cx="20" cy="20" r="12" stroke="var(--tf-border)" strokeWidth="1.8" />
        <circle cx="20" cy="20" r="6.5" stroke="var(--tf-text-muted)" strokeWidth="1.6" />
        <circle cx="20" cy="20" r="2.5" fill="var(--tf-accent)" />
        <path
          d="M20 5V9M20 31V35M5 20H9M31 20H35"
          stroke="var(--tf-text-dim)"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 40 40" fill="none" className={className} aria-hidden="true">
      <rect x="7" y="9" width="26" height="24" rx="4" stroke="var(--tf-border)" strokeWidth="1.8" />
      <path d="M7 16H33" stroke="var(--tf-border)" strokeWidth="1.8" />
      <path d="M14 6V11M26 6V11" stroke="var(--tf-text-muted)" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="20" cy="24.5" r="4" stroke="var(--tf-accent)" strokeWidth="2" />
      <circle cx="20" cy="24.5" r="1.4" fill="var(--tf-accent)" />
    </svg>
  );
}

/**
 * 1. Falling Words — Featured animated SVG stage with independently falling letter tokens & target lock.
 */
export function FallingWordsPreviewSvg({ isHovered = false }) {
  const tokens = [
    { id: 't1', x: 34, label: 'TYPE', baseY: 22, travel: 112, duration: 5.4, locked: false },
    { id: 't2', x: 128, label: 'FLOW', baseY: 56, travel: 92, duration: 4.2, locked: true },
    { id: 't3', x: 224, label: 'SYNC', baseY: 18, travel: 116, duration: 6.1, locked: false },
    { id: 't4', x: 288, label: 'KEY', baseY: 74, travel: 76, duration: 4.8, locked: false },
  ];

  return (
    <svg viewBox="0 0 360 196" fill="none" className="w-full h-auto" aria-hidden="true">
      {/* Subtle lane guides */}
      {[56, 152, 246, 308].map((lx) => (
        <line
          key={lx}
          x1={lx}
          y1="10"
          x2={lx}
          y2="168"
          stroke="var(--tf-border)"
          strokeWidth="1"
          strokeDasharray="3 5"
          opacity="0.65"
        />
      ))}

      {/* Horizon floor line */}
      <motion.line
        x1="14"
        y1="170"
        x2="346"
        y2="170"
        stroke={isHovered ? 'var(--tf-accent)' : 'var(--tf-border)'}
        strokeWidth="1.5"
        strokeLinecap="round"
        animate={{ opacity: isHovered ? 0.85 : 0.6 }}
        transition={{ duration: 0.25 }}
      />

      {/* Falling word tokens */}
      {tokens.map((tok, i) => {
        const w = tok.label.length * 10 + 18;
        return (
          <motion.g
            key={tok.id}
            animate={{
              y: isHovered ? [tok.baseY, tok.baseY + tok.travel * 0.45, tok.baseY] : [tok.baseY, tok.baseY + 24, tok.baseY],
              opacity: [0.85, 1, 0.85],
            }}
            transition={{
              duration: isHovered ? tok.duration * 0.65 : tok.duration,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.35,
            }}
          >
            <rect
              x={tok.x}
              y={0}
              width={w}
              height="24"
              rx="5"
              fill="var(--tf-bg)"
              stroke={tok.locked ? 'var(--tf-accent)' : 'var(--tf-border)'}
              strokeWidth={tok.locked ? '1.5' : '1.1'}
            />
            {tok.locked ? (
              <>
                <text
                  x={tok.x + 9}
                  y={16}
                  fontSize="11"
                  fontFamily="var(--tf-font-mono)"
                  fontWeight="600"
                  fill="var(--tf-accent)"
                >
                  FL
                </text>
                <text
                  x={tok.x + 23}
                  y={16}
                  fontSize="11"
                  fontFamily="var(--tf-font-mono)"
                  fontWeight="500"
                  fill="var(--tf-text)"
                >
                  OW
                </text>
                {/* Target lock reticle corner ticks */}
                <motion.path
                  d={`M${tok.x - 5} 6V-3H${tok.x + 4} M${tok.x + w + 5} 18V27H${tok.x + w - 4}`}
                  stroke="var(--tf-accent)"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  animate={{ opacity: isHovered ? 1 : 0.45 }}
                  transition={{ duration: 0.2 }}
                />
              </>
            ) : (
              <text
                x={tok.x + 9}
                y={16}
                fontSize="11"
                fontFamily="var(--tf-font-mono)"
                fontWeight="500"
                fill="var(--tf-text-muted)"
              >
                {tok.label}
              </text>
            )}
          </motion.g>
        );
      })}
    </svg>
  );
}

/**
 * 2. Word Sprint — Horizontal speed lines & gliding progress indicator.
 */
export function WordSprintPreviewSvg({ isHovered = false }) {
  const streaks = [
    { y: 26, x1: 24, w: 68, delay: 0 },
    { y: 46, x1: 58, w: 96, delay: 0.2 },
    { y: 82, x1: 38, w: 54, delay: 0.4 },
  ];

  return (
    <svg viewBox="0 0 280 108" fill="none" className="w-full h-auto" aria-hidden="true">
      {/* Horizontal speed lines */}
      {streaks.map((s, idx) => (
        <motion.line
          key={idx}
          x1={s.x1}
          y1={s.y}
          x2={s.x1 + s.w}
          y2={s.y}
          stroke="var(--tf-border)"
          strokeWidth="1.5"
          strokeLinecap="round"
          animate={{
            x: isHovered ? [0, 36, 0] : [0, 10, 0],
            opacity: isHovered ? [0.45, 0.95, 0.45] : [0.4, 0.65, 0.4],
          }}
          transition={{
            duration: isHovered ? 1.1 : 2.6,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: s.delay,
          }}
        />
      ))}

      {/* Sprint Progress Rail */}
      <line x1="20" y1="64" x2="260" y2="64" stroke="var(--tf-border)" strokeWidth="2" strokeLinecap="round" />

      {/* Active Progress Fill */}
      <motion.line
        x1="20"
        y1="64"
        x2="185"
        y2="64"
        stroke="var(--tf-accent)"
        strokeWidth="2.5"
        strokeLinecap="round"
        animate={{ x2: isHovered ? 225 : 155 }}
        transition={{ duration: 0.4, ease: TF_EASE }}
      />

      {/* Moving Progress Chevron Node */}
      <motion.g
        animate={{ x: isHovered ? 225 : 155 }}
        transition={{ duration: 0.4, ease: TF_EASE }}
      >
        <circle cx="0" cy="64" r="6" fill="var(--tf-bg)" stroke="var(--tf-accent)" strokeWidth="2" />
        <path
          d="M13 58L19 64L13 70"
          stroke="var(--tf-accent)"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </motion.g>

      {/* Queue checkpoints */}
      {[80, 140, 200, 260].map((cx) => (
        <circle key={cx} cx={cx} cy="64" r="2" fill="var(--tf-text-dim)" />
      ))}
    </svg>
  );
}

/**
 * 3. Survival Mode — Geometric shield core with pulsing integrity & life segments.
 */
export function SurvivalPreviewSvg({ isHovered = false }) {
  return (
    <svg viewBox="0 0 200 108" fill="none" className="w-full h-auto" aria-hidden="true">
      {/* Outer Pulse Ring */}
      <motion.path
        d="M100 14L134 26.5V52.5C134 71.8 119.5 87.2 100 94C80.5 87.2 66 71.8 66 52.5V26.5L100 14Z"
        stroke="var(--tf-accent)"
        strokeWidth="1.2"
        strokeLinejoin="round"
        animate={{
          scale: isHovered ? [1, 1.07, 1] : [1, 1.02, 1],
          opacity: isHovered ? [0.2, 0.55, 0.2] : [0.12, 0.25, 0.12],
        }}
        transition={{ duration: isHovered ? 1.4 : 2.8, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '100px 54px' }}
      />

      {/* Main Shield */}
      <path
        d="M100 20L128 30V52C128 68 116 81 100 87C84 81 72 68 72 52V30L100 20Z"
        fill="var(--tf-bg)"
        stroke={isHovered ? 'var(--tf-accent)' : 'var(--tf-border)'}
        strokeWidth="1.8"
        strokeLinejoin="round"
        style={{ transition: 'stroke 200ms ease' }}
      />

      {/* Shield Core Mark */}
      <motion.path
        d="M91 53L97 59L110 45"
        stroke="var(--tf-accent)"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        animate={{ scale: isHovered ? 1.08 : 1 }}
        transition={{ duration: 0.2, ease: TF_EASE }}
        style={{ transformOrigin: '100px 52px' }}
      />

      {/* Life Integrity Indicators (3 lives) */}
      {[0, 1, 2].map((idx) => {
        const y = 36 + idx * 14;
        return (
          <motion.rect
            key={idx}
            x="150"
            y={y}
            width={24}
            height="5.5"
            rx="2.75"
            fill="var(--tf-accent)"
            animate={{
              opacity: isHovered ? [0.65, 1, 0.65] : 0.85,
              width: isHovered ? 28 : 24,
            }}
            transition={{
              duration: 0.9,
              repeat: isHovered ? Infinity : 0,
              delay: idx * 0.16,
            }}
          />
        );
      })}
    </svg>
  );
}

/**
 * 4. Accuracy Challenge — Precision reticle with rotating calibration ring & target-lock.
 */
export function AccuracyPreviewSvg({ isHovered = false }) {
  return (
    <svg viewBox="0 0 200 108" fill="none" className="w-full h-auto" aria-hidden="true">
      {/* Rotating Outer Calibration Ring */}
      <motion.g
        animate={{ rotate: isHovered ? 90 : 18 }}
        transition={{ duration: isHovered ? 0.65 : 1.2, ease: TF_EASE }}
        style={{ transformOrigin: '100px 54px' }}
      >
        <circle
          cx="100"
          cy="54"
          r="36"
          stroke="var(--tf-border)"
          strokeWidth="1.5"
          strokeDasharray="10 6"
        />
      </motion.g>

      {/* Scanning Sweep Arc */}
      <motion.circle
        cx="100"
        cy="54"
        r="25"
        stroke="var(--tf-accent)"
        strokeWidth="1.6"
        strokeDasharray="36 120"
        strokeLinecap="round"
        animate={{ rotate: isHovered ? 360 : 0 }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        style={{ transformOrigin: '100px 54px', opacity: isHovered ? 0.9 : 0.4 }}
      />

      {/* Target-Lock Reticle Ticks */}
      <motion.g
        animate={{ scale: isHovered ? 0.86 : 1 }}
        transition={{ duration: 0.25, ease: TF_EASE }}
        style={{ transformOrigin: '100px 54px' }}
      >
        <path
          d="M100 14V24M100 84V94M60 54H70M130 54H140"
          stroke={isHovered ? 'var(--tf-accent)' : 'var(--tf-text-muted)'}
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </motion.g>

      {/* Inner Precision Core */}
      <circle cx="100" cy="54" r="11" stroke="var(--tf-text-dim)" strokeWidth="1.2" />
      <motion.circle
        cx="100"
        cy="54"
        r="3.5"
        fill="var(--tf-accent)"
        animate={{ scale: isHovered ? 1.25 : 1 }}
        transition={{ duration: 0.2, ease: TF_EASE }}
        style={{ transformOrigin: '100px 54px' }}
      />
    </svg>
  );
}

/**
 * 5. Daily Challenge — 7-day calendar grid & progressive completion arc.
 */
export function DailyChallengePreviewSvg({ isHovered = false, isCompletedToday = false }) {
  const days = [0, 1, 2, 3, 4, 5, 6];
  const todayIdx = 4;

  return (
    <svg viewBox="0 0 280 108" fill="none" className="w-full h-auto" aria-hidden="true">
      {/* Calendar Frame */}
      <rect
        x="24"
        y="14"
        width="232"
        height="80"
        rx="8"
        fill="var(--tf-bg)"
        stroke={isHovered ? 'var(--tf-accent)' : 'var(--tf-border)'}
        strokeWidth="1.4"
        style={{ transition: 'stroke 200ms ease' }}
      />
      <line x1="24" y1="34" x2="256" y2="34" stroke="var(--tf-border)" strokeWidth="1.2" />

      {/* Top Binding Posts */}
      {[72, 140, 208].map((bx) => (
        <line
          key={bx}
          x1={bx}
          y1="9"
          x2={bx}
          y2="18"
          stroke="var(--tf-text-muted)"
          strokeWidth="2"
          strokeLinecap="round"
        />
      ))}

      {/* 7-day Row Cells */}
      {days.map((d) => {
        const cx = 42 + d * 30;
        const isPast = d < todayIdx;
        const isToday = d === todayIdx;
        return (
          <g key={d}>
            <rect
              x={cx}
              y="44"
              width="20"
              height="20"
              rx="4"
              fill={
                isToday
                  ? 'var(--tf-accent)'
                  : isPast
                  ? 'var(--tf-surface)'
                  : 'transparent'
              }
              fillOpacity={isToday ? (isCompletedToday || isHovered ? 0.22 : 0.14) : 1}
              stroke={
                isToday
                  ? 'var(--tf-accent)'
                  : isPast
                  ? 'var(--tf-border)'
                  : 'var(--tf-border)'
              }
              strokeOpacity={isToday ? 1 : isPast ? 0.9 : 0.45}
              strokeWidth={isToday ? '1.5' : '1'}
            />
            {isPast && (
              <circle cx={cx + 10} cy="54" r="2.2" fill="var(--tf-text-muted)" />
            )}
            {isToday && (
              <motion.circle
                cx={cx + 10}
                cy="54"
                r="3.2"
                fill="var(--tf-accent)"
                animate={{ scale: isHovered ? [1, 1.35, 1] : 1 }}
                transition={{ duration: 0.9, repeat: isHovered ? Infinity : 0 }}
                style={{ transformOrigin: `${cx + 10}px 54px` }}
              />
            )}
          </g>
        );
      })}

      {/* Progressive Daily Completion Track */}
      <line x1="42" y1="78" x2="238" y2="78" stroke="var(--tf-border)" strokeWidth="2.5" strokeLinecap="round" />
      <motion.line
        x1="42"
        y1="78"
        x2={isCompletedToday ? 238 : 162}
        y2="78"
        stroke="var(--tf-accent)"
        strokeWidth="2.5"
        strokeLinecap="round"
        animate={{
          x2: isCompletedToday ? 238 : isHovered ? 196 : 162,
        }}
        transition={{ duration: 0.35, ease: TF_EASE }}
      />
    </svg>
  );
}

/**
 * Clean geometric keyboard horizon graphic for empty analytics state.
 */
export function EmptyStatsIllustration({ className = 'w-24 h-16' }) {
  return (
    <svg viewBox="0 0 120 72" fill="none" className={className} aria-hidden="true">
      <rect x="8" y="14" width="104" height="46" rx="8" stroke="var(--tf-border)" strokeWidth="1.8" />
      <rect x="16" y="23" width="14" height="10" rx="2" fill="var(--tf-surface)" stroke="var(--tf-border)" />
      <rect x="34" y="23" width="14" height="10" rx="2" fill="var(--tf-surface)" stroke="var(--tf-border)" />
      <rect x="52" y="23" width="14" height="10" rx="2" fill="var(--tf-accent)" fillOpacity="0.22" stroke="var(--tf-accent)" />
      <rect x="70" y="23" width="14" height="10" rx="2" fill="var(--tf-surface)" stroke="var(--tf-border)" />
      <rect x="88" y="23" width="16" height="10" rx="2" fill="var(--tf-surface)" stroke="var(--tf-border)" />
      <rect x="28" y="40" width="64" height="9" rx="2.5" fill="var(--tf-surface)" stroke="var(--tf-border)" />
    </svg>
  );
}

/**
 * Subtle SVG radial accuracy ring for Accuracy Challenge & Result highlights.
 */
export function AccuracyRingSvg({ percentage = 100, size = 64, strokeWidth = 4.5 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, percentage));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--tf-border)"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--tf-accent)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 280ms cubic-bezier(0.16, 1, 0.3, 1)' }}
      />
    </svg>
  );
}
