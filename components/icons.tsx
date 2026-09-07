/**
 * Inline outline icon set for the quotation flow. Presentation only — no
 * dependencies. Every icon inherits `currentColor` and sizes via className.
 */
type IconProps = { className?: string };

const S = {
  fill: "none" as const,
  stroke: "currentColor" as const,
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
};

function Svg({ className = "w-5 h-5", children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg className={className} {...S} aria-hidden>
      {children}
    </svg>
  );
}

export const IconHome = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 10.5 12 4l9 6.5" />
    <path d="M5.5 9.5V20h13V9.5" />
    <path d="M9.75 20v-5.5h4.5V20" />
  </Svg>
);

export const IconBuilding = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 20h16" />
    <path d="M6 20V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v15" />
    <path d="M14 20V9h3a1 1 0 0 1 1 1v10" />
    <path d="M8.5 7.5h3M8.5 11h3M8.5 14.5h3" />
  </Svg>
);

export const IconHardHat = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 17h18" />
    <path d="M5 17v-2a7 7 0 0 1 14 0v2" />
    <path d="M10 4.6A2 2 0 0 1 12 3a2 2 0 0 1 2 1.6l.4 3.4" />
    <path d="M9.6 8 10 4.6" />
    <path d="M3 20h18" />
  </Svg>
);

export const IconWindow = (p: IconProps) => (
  <Svg {...p}>
    <rect x="4" y="4" width="16" height="16" rx="1.5" />
    <path d="M12 4v16M4 12h16" />
  </Svg>
);

export const IconSparkle = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 4.5 13.6 9l4.5 1.6-4.5 1.6L12 16.6 10.4 12 5.9 10.6 10.4 9 12 4.5Z" />
    <path d="M18.5 15.5l.7 1.9 1.9.7-1.9.7-.7 1.9-.7-1.9-1.9-.7 1.9-.7.7-1.9Z" />
  </Svg>
);

export const IconStairs = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 20h4v-4h4v-4h4V8h4" />
    <path d="M4 20V16h4" />
  </Svg>
);

export const IconBox = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 8.5 12 5l8 3.5v7L12 19l-8-3.5v-7Z" />
    <path d="M4 8.5 12 12l8-3.5M12 12v7" />
  </Svg>
);

export const IconStar = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 4.75 14.1 9l4.7.7-3.4 3.3.8 4.7-4.2-2.2-4.2 2.2.8-4.7L5.2 9.7 9.9 9 12 4.75Z" />
  </Svg>
);

export const IconDots = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M8.5 12h.01M12 12h.01M15.5 12h.01" strokeWidth={2.2} />
  </Svg>
);

export const IconDroplet = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3.5s5.5 5.6 5.5 9.2a5.5 5.5 0 0 1-11 0C6.5 9.1 12 3.5 12 3.5Z" />
  </Svg>
);

export const IconSpray = (p: IconProps) => (
  <Svg {...p}>
    <path d="M9 8h5v12H9z" />
    <path d="M10.5 8V5h3v3" />
    <path d="M17 5h.01M19 8h.01M17 11h.01" strokeWidth={2} />
  </Svg>
);

export const IconPaw = (p: IconProps) => (
  <Svg {...p}>
    <ellipse cx="8" cy="9" rx="1.7" ry="2.2" />
    <ellipse cx="12" cy="7.6" rx="1.7" ry="2.2" />
    <ellipse cx="16" cy="9" rx="1.7" ry="2.2" />
    <path d="M12 12.2c2.4 0 4.3 1.8 4.3 3.6S14.4 19 12 19s-4.3-1.4-4.3-3.2 1.9-3.6 4.3-3.6Z" />
  </Svg>
);

export const IconRug = (p: IconProps) => (
  <Svg {...p}>
    <rect x="4" y="6" width="16" height="12" rx="1.5" />
    <path d="M7 6v12M17 6v12" />
  </Svg>
);

export const IconSun = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" />
  </Svg>
);

export const IconSmoke = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 16h13v3H4z" />
    <path d="M19 16h1v3h-1z" />
    <path d="M8 12.5c0-2 2-2 2-4s-1.2-2.2-1.2-2.2" />
    <path d="M13 12.5c0-1.6 1.6-1.6 1.6-3.2" />
  </Svg>
);

export const IconBolt = (p: IconProps) => (
  <Svg {...p}>
    <path d="M13 3 5.5 13.5H11l-.5 7.5L18 10.5h-5.5L13 3Z" />
  </Svg>
);

export const IconCheck = (p: IconProps) => (
  <Svg {...p}>
    <path d="m5 12.5 4.5 4.5L19 7" strokeWidth={2} />
  </Svg>
);

export const IconCheckCircle = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="m8.5 12.2 2.4 2.4 4.6-4.9" />
  </Svg>
);

export const IconClock = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 1.8" />
  </Svg>
);

export const IconShield = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3.5 19 6v5.2c0 4.3-2.9 8.2-7 9.3-4.1-1.1-7-5-7-9.3V6l7-2.5Z" />
  </Svg>
);

export const IconShieldCheck = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3.5 19 6v5.2c0 4.3-2.9 8.2-7 9.3-4.1-1.1-7-5-7-9.3V6l7-2.5Z" />
    <path d="m9.2 11.8 2 2 3.6-3.8" />
  </Svg>
);

export const IconHeart = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 19.5s-6.8-4.2-6.8-8.7A3.7 3.7 0 0 1 12 8.4a3.7 3.7 0 0 1 6.8 2.4c0 4.5-6.8 8.7-6.8 8.7Z" />
  </Svg>
);

export const IconPhone = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h2.2a1 1 0 0 1 1 .8l.8 3a1 1 0 0 1-.5 1.1l-1.5.8a11 11 0 0 0 5.3 5.3l.8-1.5a1 1 0 0 1 1.1-.5l3 .8a1 1 0 0 1 .8 1V17a1.5 1.5 0 0 1-1.5 1.5h-.6C9.2 18.5 4 13.3 4 6.9v-1.4Z" />
  </Svg>
);

export const IconMail = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3.5" y="5.5" width="17" height="13" rx="1.5" />
    <path d="m4 7 8 5.5L20 7" />
  </Svg>
);

export const IconChat = (p: IconProps) => (
  <Svg {...p}>
    <path d="M20 12.5c0 3.6-3.6 6.5-8 6.5a9.7 9.7 0 0 1-2.6-.35L5 20l1.1-3.1A6.2 6.2 0 0 1 4 12.5C4 8.9 7.6 6 12 6s8 2.9 8 6.5Z" />
  </Svg>
);

export const IconInfo = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 11v5" />
    <path d="M12 8h.01" strokeWidth={2.2} />
  </Svg>
);

export const IconUser = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="8.5" r="3.5" />
    <path d="M5 20c0-3.3 3.1-5.5 7-5.5s7 2.2 7 5.5" />
  </Svg>
);

export const IconPin = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 21s6.5-5.6 6.5-10a6.5 6.5 0 1 0-13 0c0 4.4 6.5 10 6.5 10Z" />
    <circle cx="12" cy="10.8" r="2.4" />
  </Svg>
);

export const IconCalendar = (p: IconProps) => (
  <Svg {...p}>
    <rect x="4" y="5.5" width="16" height="14.5" rx="1.5" />
    <path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" />
  </Svg>
);

export const IconNote = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6 4h9l3 3v13H6z" />
    <path d="M14.5 4v3.5H18M9 12h6M9 15.5h4" />
  </Svg>
);

export const IconCoins = (p: IconProps) => (
  <Svg {...p}>
    <ellipse cx="12" cy="7" rx="6.5" ry="2.8" />
    <path d="M5.5 7v4.6c0 1.6 2.9 2.8 6.5 2.8s6.5-1.2 6.5-2.8V7" />
    <path d="M5.5 11.6v4.6c0 1.6 2.9 2.8 6.5 2.8s6.5-1.2 6.5-2.8v-4.6" />
  </Svg>
);

export const IconPencil = (p: IconProps) => (
  <Svg {...p}>
    <path d="m14.5 5.5 4 4L9 19H5v-4l9.5-9.5Z" />
  </Svg>
);

export const IconArrowRight = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 12h13M13 6.5 18.5 12 13 17.5" />
  </Svg>
);

export const IconArrowLeft = (p: IconProps) => (
  <Svg {...p}>
    <path d="M19 12H6M11 6.5 5.5 12 11 17.5" />
  </Svg>
);

export const IconChevronRight = (p: IconProps) => (
  <Svg {...p}>
    <path d="m9.5 6 6 6-6 6" />
  </Svg>
);

export const IconPhoto = (p: IconProps) => (
  <Svg {...p}>
    <rect x="4" y="5.5" width="16" height="13" rx="1.5" />
    <circle cx="9" cy="10" r="1.5" />
    <path d="m5 16.5 4.2-4 3 2.6 2.8-2.4 4 3.8" />
  </Svg>
);

export const IconTag = (p: IconProps) => (
  <Svg {...p}>
    <path d="M11 4H4v7l9 9 7-7-9-9Z" />
    <path d="M7.5 7.5h.01" strokeWidth={2.4} />
  </Svg>
);

export const IconEye = (p: IconProps) => (
  <Svg {...p}>
    <path d="M2.5 12S6 6.5 12 6.5 21.5 12 21.5 12 18 17.5 12 17.5 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="2.8" />
  </Svg>
);

export const IconPlusCircle = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 8.5v7M8.5 12h7" />
  </Svg>
);

export const IconLock = (p: IconProps) => (
  <Svg {...p}>
    <rect x="5" y="10.5" width="14" height="9.5" rx="1.5" />
    <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
  </Svg>
);

/** Category value → icon. Presentation-only lookup. */
export const CATEGORY_ICONS: Record<string, (p: IconProps) => React.ReactElement> = {
  move_out_cleaning: IconHome,
  private_cleaning: IconHeart,
  office_cleaning: IconBuilding,
  construction_cleaning: IconHardHat,
  window_cleaning: IconWindow,
  deep_cleaning: IconSparkle,
  facility_staircase_cleaning: IconStairs,
  clearance_disposal: IconBox,
  special_cleaning: IconStar,
  other_cleaning: IconDots,
};

/** Add-on key → icon. Presentation-only lookup. */
export const ADDON_ICONS: Record<string, (p: IconProps) => React.ReactElement> = {
  terrace_pressure: IconSpray,
  limescale_heavy: IconDroplet,
  smoker: IconSmoke,
  pet: IconPaw,
  carpet: IconRug,
  large_cellar: IconBox,
  wintergarden: IconSun,
};
