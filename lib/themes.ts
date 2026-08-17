export type ThemeId =
  | "neon"
  | "minimal"
  | "aurora"
  | "sunset"
  | "professional"
  | "clean";

export type Theme = {
  id: ThemeId;
  name: string;
  description: string;
  isPro: boolean;
  background: string;
  accent: string;
};

export const THEMES: Theme[] = [
  {
    id: "neon",
    name: "Neon",
    description: "Purple / Blue",
    isPro: false,
    background: "from-[#0d061b] via-[#11102b] to-[#07121e]",
    accent: "from-violet-500 to-blue-500",
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Black / White",
    isPro: false,
    background: "from-zinc-950 via-black to-zinc-950",
    accent: "from-white to-zinc-300",
  },
  {
    id: "aurora",
    name: "Aurora",
    description: "Purple / Cyan",
    isPro: true,
    background: "from-[#11112f] via-[#17223f] to-[#063541]",
    accent: "from-violet-400 to-cyan-300",
  },
  {
    id: "sunset",
    name: "Sunset",
    description: "Orange / Pink",
    isPro: true,
    background: "from-[#2a1028] via-[#4a1b32] to-[#3a180d]",
    accent: "from-orange-400 to-pink-500",
  },
  {
    id: "professional",
    name: "Professional",
    description: "Dark navy",
    isPro: true,
    background: "from-[#07111f] via-[#0c1c32] to-[#07111f]",
    accent: "from-blue-400 to-cyan-300",
  },
  {
    id: "clean",
    name: "Clean",
    description: "White / Gray",
    isPro: false,
    background: "from-white via-zinc-100 to-zinc-200",
    accent: "from-zinc-900 to-zinc-600",
  },
];
