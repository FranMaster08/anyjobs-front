import fs from 'node:fs';
import path from 'node:path';

type EvidenceCssVar = { name: string; value: string; definedIn: string };

type Evidence = {
  meta: { url: string; capturedAt: string; viewport: { width: number; height: number }; notes: unknown[] };
  tokens: {
    color: {
      palette: {
        neutrals: Array<{ name: string; value: string }>;
        brand: Array<{ name: string; value: string }>;
        semantic: Array<{ name: string; value: string | null }>;
      };
    };
    typography: {
      scale: Array<{
        token: string;
        fontFamily: string | null;
        fontSize: string | null;
        fontWeight: string | null;
        lineHeight: string | null;
        letterSpacing: string | null;
        textTransform: string | null;
      }>;
      body: { fontFamily: string | null; fontSize: string | null; lineHeight: string | null };
    };
  };
  raw: { cssVariables: EvidenceCssVar[] };
};

function ensurePosix(p: string) {
  return p.split(path.sep).join(path.posix.sep);
}

function parseFontFamilyList(fontFamily: string): string[] {
  return fontFamily
    .split(',')
    .map((s) => s.trim())
    .map((s) => s.replace(/^["']|["']$/g, ''))
    .filter(Boolean);
}

function toTailwindColorKey(name: string) {
  return name.replace(/\./g, '-');
}

function readEvidence(evidencePath: string): Evidence {
  const raw = fs.readFileSync(evidencePath, 'utf8');
  return JSON.parse(raw) as Evidence;
}

function buildCssVarMap(vars: EvidenceCssVar[]) {
  const m = new Map<string, string>();
  for (const v of vars) m.set(v.name, v.value);
  return m;
}

function pickCornerRadii(cssVarMap: Map<string, string>) {
  const pairs: Array<[string, string]> = [];
  for (const [k, v] of cssVarMap.entries()) {
    if (!k.startsWith('--corner-radius-')) continue;
    if (!k.endsWith('-border-radius')) continue;
    if (!v) continue;
    pairs.push([k, v.trim()]);
  }

  const out: Record<string, string> = {};
  for (const [k, v] of pairs) {
    // Example: --corner-radius-small8px-border-radius
    const m = k.match(/^--corner-radius-([a-z]+)(\d+)px-border-radius$/);
    if (!m) continue;
    const label = m[1];
    const px = `${m[2]}px`;
    // Keep original labels but normalize to tailwind-friendly keys
    const key =
      label === 'tiny'
        ? 'tiny'
        : label === 'small'
          ? 'sm'
          : label === 'medium'
            ? 'md'
            : label === 'large'
              ? 'lg'
              : label === 'xlarge'
                ? 'xl'
                : label === 'xxlarge'
                  ? '2xl'
                  : label === 'xxxlarge'
                    ? '3xl'
                    : label;
    out[key] = v || px;
  }

  return out;
}

function pickElevations(cssVarMap: Map<string, string>) {
  const out: Record<string, string> = {};

  for (const [k, v] of cssVarMap.entries()) {
    if (!k.endsWith('-box-shadow')) continue;
    if (!k.startsWith('--elevation-')) continue;
    const value = v.trim();
    if (!value) continue;

    // --elevation-high-box-shadow -> high
    const simple = k
      .replace(/^--elevation-/, '')
      .replace(/-box-shadow$/, '')
      .trim();
    out[simple] = value;
  }

  return out;
}

function pickMotion(cssVarMap: Map<string, string>) {
  const durations: Record<string, string> = {};
  const easings: Record<string, string> = {};

  for (const [k, v] of cssVarMap.entries()) {
    const value = v.trim();
    if (!value) continue;

    // durations (ms)
    if (k.startsWith('--motion-springs-') && k.endsWith('-duration')) {
      // --motion-springs-fast-duration
      const name = k.replace(/^--motion-springs-/, '').replace(/-duration$/, '');
      durations[name] = value;
    }

    // timing functions
    if (k.startsWith('--motion-') && k.endsWith('-curve-animation-timing-function')) {
      const name = k.replace(/^--motion-/, '').replace(/-curve-animation-timing-function$/, '');
      easings[name] = value;
    }
  }

  return { durations, easings };
}

function main() {
  const repoRoot = path.resolve(__dirname, '..', '..', '..');
  const defaultEvidence = path.resolve(
    repoRoot,
    'openspec',
    'changes',
    'extract-style-base-line',
    'evidence',
    'airbnb-home-style.json',
  );

  const evidencePath = path.resolve(process.cwd(), process.argv[2] ?? defaultEvidence);
  const outPath = path.resolve(process.cwd(), process.argv[3] ?? 'tailwind.preset.ts');

  const evidence = readEvidence(evidencePath);
  const cssVarMap = buildCssVarMap(evidence.raw.cssVariables || []);

  const semantic = Object.fromEntries(
    (evidence.tokens.color.palette.semantic || [])
      .filter((s) => s.value != null && `${s.value}`.trim() !== '')
      .map((s) => [toTailwindColorKey(s.name), s.value as string]),
  );

  const neutrals = Object.fromEntries(
    (evidence.tokens.color.palette.neutrals || []).map((c) => [toTailwindColorKey(c.name), c.value]),
  );

  const brand = Object.fromEntries(
    (evidence.tokens.color.palette.brand || []).map((c) => [toTailwindColorKey(c.name), c.value]),
  );

  const body = evidence.tokens.typography.body;
  const baseFontFamily = body.fontFamily ? parseFontFamilyList(body.fontFamily) : [];

  const typeScale = Object.fromEntries(
    (evidence.tokens.typography.scale || [])
      .filter((t) => t.fontSize && t.lineHeight)
      .map((t) => [
        t.token.replace(/^text\./, ''),
        [
          t.fontSize!,
          {
            lineHeight: t.lineHeight!,
            fontWeight: t.fontWeight ?? undefined,
            letterSpacing: t.letterSpacing ?? undefined,
            textTransform: t.textTransform ?? undefined,
          },
        ],
      ]),
  );

  const radius = pickCornerRadii(cssVarMap);
  const elevation = pickElevations(cssVarMap);
  const motion = pickMotion(cssVarMap);

  const presetSource = `import type { Config } from 'tailwindcss';\n\nexport const preset: Partial<Config> = {\n  theme: {\n    extend: {\n      colors: {\n        ...${JSON.stringify(
          {
            ...Object.fromEntries(Object.entries(semantic).map(([k, v]) => [k, v])),
            neutral: neutrals,
            brand,
          },
          null,
          2,
        )},\n      },\n      fontFamily: {\n        sans: ${JSON.stringify(baseFontFamily, null, 2)},\n      },\n      fontSize: ${JSON.stringify(typeScale, null, 2)},\n      borderRadius: ${JSON.stringify(radius, null, 2)},\n      boxShadow: ${JSON.stringify(elevation, null, 2)},\n      transitionDuration: ${JSON.stringify(motion.durations, null, 2)},\n      transitionTimingFunction: ${JSON.stringify(motion.easings, null, 2)},\n    },\n  },\n};\n\nexport default preset;\n`;

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, presetSource, 'utf8');

  // Helpful console output for CI/dev feedback.
  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify(
      {
        evidencePath: ensurePosix(evidencePath),
        outPath: ensurePosix(outPath),
        colors: {
          semantic: Object.keys(semantic).length,
          neutrals: Object.keys(neutrals).length,
          brand: Object.keys(brand).length,
        },
        radiusKeys: Object.keys(radius),
        elevationKeys: Object.keys(elevation).slice(0, 10),
        motion: { durations: Object.keys(motion.durations).length, easings: Object.keys(motion.easings).length },
      },
      null,
      2,
    ),
  );
}

main();

