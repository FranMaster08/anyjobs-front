const { webkit } = require('playwright');

const TARGET_URL =
  process.argv[2] ||
  'https://www.airbnb.com.ar/?gclsrc=aw.ds&&c=.pi0.pk220135635_19506907875&ghost=true&gad_source=1&gad_campaignid=220135635&gbraid=0AAAAADz55LkGXUGoi3XSG5CkRvS-f0wFT&gclid=CjwKCAiA2PrMBhA4EiwAwpHyC_PS39Ygpc4n32akQo6QJskX2u7xjalUBSYJwWxad7UsM5QeuIg4ixoCXgMQAvD_BwE';

function parseIntEnv(name, fallback) {
  const raw = process.env[name];
  if (raw == null || raw === '') return fallback;
  const v = Number.parseInt(raw, 10);
  return Number.isFinite(v) ? v : fallback;
}

const VIEWPORT = {
  width: parseIntEnv('STYLE_EXTRACTOR_VIEWPORT_WIDTH', 1440),
  height: parseIntEnv('STYLE_EXTRACTOR_VIEWPORT_HEIGHT', 900),
};

function nowIso() {
  return new Date().toISOString();
}

function rgbToHex(rgb) {
  if (!rgb) return null;
  const m = rgb
    .trim()
    .match(/^rgba?\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})(?:\s*,\s*([0-9.]+))?\s*\)$/i);
  if (!m) return null;
  const r = Number(m[1]);
  const g = Number(m[2]);
  const b = Number(m[3]);
  const a = m[4] === undefined ? 1 : Number(m[4]);
  if (![r, g, b, a].every((n) => Number.isFinite(n))) return null;
  if (a !== 1) return null;
  const toHex = (n) => n.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function uniq(arr) {
  return Array.from(new Set(arr.filter((v) => v != null && `${v}`.trim() !== '')));
}

function extractPxTokens(value) {
  if (!value) return [];
  const s = String(value);
  const matches = s.match(/-?\d*\.?\d+px/g);
  return matches ? matches.map((m) => m.trim()) : [];
}

async function tryAcceptConsent(page) {
  const candidates = [
    'button:has-text("Aceptar")',
    'button:has-text("Acepto")',
    'button:has-text("Aceptar todo")',
    'button:has-text("Aceptar todas")',
    'button:has-text("Accept")',
    'button:has-text("I agree")',
    'button:has-text("OK")',
    'button:has-text("Continuar")',
  ];

  for (const sel of candidates) {
    const loc = page.locator(sel).first();
    try {
      if (await loc.isVisible({ timeout: 1500 })) {
        await loc.click({ timeout: 3000 });
        await page.waitForTimeout(800);
        return { clicked: sel };
      }
    } catch {
      // ignore
    }
  }
  return { clicked: null };
}

async function main() {
  const browser = await webkit.launch({ headless: true });

  const metaNotes = [];
  const responses = [];
  try {
    const context = await browser.newContext({
      viewport: VIEWPORT,
      locale: 'es-AR',
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
    });
    context.setDefaultTimeout(10000);

    const page = await context.newPage();

    // Reduce load without impacting computed CSS.
    await page.route('**/*', async (route) => {
      const type = route.request().resourceType();
      if (type === 'image' || type === 'media') return route.abort();
      return route.continue();
    });

    page.on('response', (res) => {
      responses.push({
        url: res.url(),
        status: res.status(),
        contentType: res.headers()['content-type'] || null,
      });
    });

    try {
      // Best-effort navigation: do not wait for full network idle.
      await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    } catch (e) {
      metaNotes.push({ type: 'navigation.error', message: String(e?.message || e) });
    }

    await page.waitForTimeout(1500);
    const consent = await tryAcceptConsent(page);
    if (consent.clicked) metaNotes.push({ type: 'consent', action: 'clicked', selector: consent.clicked });

    // Give time for client-side styles to settle.
    await page.waitForTimeout(2000);

    // Try to expose more components (cards/footers) by scrolling.
    try {
      await page.evaluate(() => window.scrollTo(0, Math.max(1200, Math.floor(window.innerHeight * 1.5))));
      await page.waitForTimeout(900);
      await page.evaluate(() => window.scrollTo(0, Math.max(2200, Math.floor(window.innerHeight * 3))));
      await page.waitForTimeout(900);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(500);
    } catch (e) {
      metaNotes.push({ type: 'scroll.error', message: String(e?.message || e) });
    }

  const selectorCandidates = {
    link: ['a[href]', 'a'],
    button: ['button', '[role="button"]'],
    input: ['input', '[role="combobox"]', '[contenteditable="true"]'],
    header: ['header', '[role="banner"]'],
    footer: ['footer', '[role="contentinfo"]'],
    card: [
      '[data-testid*="card"]',
      '[data-testid*="listing"]',
      'article',
      '[role="article"]',
      'section',
    ],
  };

  const pageData = await page.evaluate(({ selectorCandidates }) => {
    const VIS_ATTR = 'data-style-extractor-id';

    const isVisible = (el) => {
      if (!el) return false;
      const cs = getComputedStyle(el);
      if (cs.display === 'none') return false;
      if (cs.visibility === 'hidden') return false;
      if (Number(cs.opacity) === 0) return false;
      const r = el.getBoundingClientRect();
      if (r.width <= 1 || r.height <= 1) return false;
      return true;
    };

    const isTransparentBg = (v) => {
      if (!v) return true;
      const s = String(v).trim().toLowerCase();
      return s === 'transparent' || s === 'rgba(0, 0, 0, 0)';
    };

    const firstVisible = (cands) => {
      for (const sel of cands) {
        const nodes = Array.from(document.querySelectorAll(sel));
        for (const el of nodes.slice(0, 200)) {
          if (isVisible(el)) return el;
        }
      }
      return null;
    };

    const pickButton = (cands) => {
      const parseRgb = (v) => {
        const m = String(v || '')
          .trim()
          .match(/^rgba?\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})(?:\s*,\s*([0-9.]+))?\s*\)$/i);
        if (!m) return null;
        return { r: Number(m[1]), g: Number(m[2]), b: Number(m[3]), a: m[4] == null ? 1 : Number(m[4]) };
      };
      const isColorful = (bgc) => {
        const rgb = parseRgb(bgc);
        if (!rgb) return false;
        if (!Number.isFinite(rgb.a) || rgb.a === 0) return false;
        const max = Math.max(rgb.r, rgb.g, rgb.b);
        const min = Math.min(rgb.r, rgb.g, rgb.b);
        const delta = max - min;
        // Avoid near-white/near-gray surfaces.
        const nearGray = delta < 18;
        const nearWhite = rgb.r > 235 && rgb.g > 235 && rgb.b > 235;
        return !nearGray && !nearWhite;
      };

      for (const sel of cands) {
        const nodes = Array.from(document.querySelectorAll(sel));
        for (const el of nodes.slice(0, 400)) {
          if (!isVisible(el)) continue;
          const cs = getComputedStyle(el);
          const text = (el.textContent || '').trim().toLowerCase();
          const aria = (el.getAttribute && (el.getAttribute('aria-label') || el.getAttribute('aria-labelledby'))) || '';
          const ariaText = String(aria).toLowerCase();
          if ((text && (text.includes('buscar') || text.includes('search'))) || (ariaText && (ariaText.includes('buscar') || ariaText.includes('search')))) {
            return el;
          }
          const bgc = cs.getPropertyValue('background-color')?.trim();
          const bgi = cs.getPropertyValue('background-image')?.trim();
          if (bgi && bgi !== 'none') return el;
          if (!isTransparentBg(bgc) && isColorful(bgc)) return el;
          if (!isTransparentBg(bgc)) return el;
        }
      }
      return firstVisible(cands);
    };

    const pickInput = (cands) => {
      for (const sel of cands) {
        const nodes = Array.from(document.querySelectorAll(sel));
        for (const el of nodes.slice(0, 400)) {
          if (!isVisible(el)) continue;
          const cs = getComputedStyle(el);
          const border = cs.getPropertyValue('border')?.trim();
          const bgc = cs.getPropertyValue('background-color')?.trim();
          if (border && !border.startsWith('0px') && !isTransparentBg(bgc)) return el;
        }
      }
      return firstVisible(cands);
    };

    const pickCard = (cands) => {
      for (const sel of cands) {
        const nodes = Array.from(document.querySelectorAll(sel));
        for (const el of nodes.slice(0, 600)) {
          if (!isVisible(el)) continue;
          const cs = getComputedStyle(el);
          const bgc = cs.getPropertyValue('background-color')?.trim();
          const br = cs.getPropertyValue('border-radius')?.trim();
          const bs = cs.getPropertyValue('box-shadow')?.trim();
          const r = el.getBoundingClientRect();
          const hasSurface = !isTransparentBg(bgc) && r.width >= 220 && r.height >= 120;
          const hasShape = br && br !== '0px';
          const hasDepth = bs && bs !== 'none';
          if (hasSurface && (hasShape || hasDepth)) return el;
        }
      }
      return firstVisible(cands);
    };

    const tag = (el, id) => {
      if (!el) return null;
      try {
        el.setAttribute(VIS_ATTR, id);
      } catch {
        // ignore
      }
      return `[${VIS_ATTR}="${id}"]`;
    };

    const selectors = {
      html: 'html',
      body: 'body',
      link: tag(firstVisible(selectorCandidates.link), 'link'),
      button: tag(pickButton(selectorCandidates.button), 'button'),
      input: tag(pickInput(selectorCandidates.input), 'input'),
      header: tag(firstVisible(selectorCandidates.header), 'header'),
      footer: tag(firstVisible(selectorCandidates.footer), 'footer'),
      card: tag(pickCard(selectorCandidates.card), 'card'),
    };

    const pick = (sel) => {
      if (!sel) return null;
      const el = document.querySelector(sel);
      return el || null;
    };

    const safeCssText = (sheet) => {
      try {
        if (!sheet || !sheet.cssRules) return null;
        let out = '';
        const rules = Array.from(sheet.cssRules);
        for (const r of rules) {
          out += `${r.cssText}\n`;
          if (out.length > 250_000) break;
        }
        return out;
      } catch {
        return null;
      }
    };

    const styleSheets = Array.from(document.styleSheets || []);
    const stylesheetsOut = [];
    let inlineIndex = 0;
    for (const sheet of styleSheets) {
      const owner = sheet.ownerNode;
      const isInline = owner && owner.tagName === 'STYLE';
      const href = sheet.href || (isInline ? `inline:<style#${++inlineIndex}>` : null);
      let sizeBytes = 0;
      try {
        if (isInline && owner && typeof owner.textContent === 'string') sizeBytes = owner.textContent.length;
      } catch {
        sizeBytes = 0;
      }
      stylesheetsOut.push({
        href: href || '',
        inline: Boolean(isInline),
        sizeBytes,
        readable: safeCssText(sheet) != null,
      });
    }

    const cssVariables = [];
    const keySelectorsSample = [];
    const varsSeen = new Set();
    const addVar = (name, value, definedIn) => {
      if (!name || varsSeen.has(name)) return;
      varsSeen.add(name);
      cssVariables.push({ name, value: value ?? '', definedIn: definedIn ?? '' });
    };

    for (const sheet of styleSheets) {
      let rules = null;
      try {
        rules = sheet.cssRules ? Array.from(sheet.cssRules) : null;
      } catch {
        rules = null;
      }
      if (!rules) continue;
      for (const rule of rules) {
        if (!rule || !rule.cssText) continue;
        const text = rule.cssText;
        if (keySelectorsSample.length < 80 && rule.selectorText) keySelectorsSample.push(rule.selectorText);
        // Extract custom properties from style rules.
        if ('style' in rule && rule.style) {
          for (let i = 0; i < rule.style.length; i++) {
            const prop = rule.style[i];
            if (prop && prop.startsWith('--')) {
              addVar(prop, rule.style.getPropertyValue(prop)?.trim() || '', sheet.href || 'inline');
            }
          }
        }
        // Extract from :root blocks even if style is not directly enumerable.
        if (text.includes('--') && text.includes(':')) {
          const m = text.match(/--[A-Za-z0-9_-]+\s*:\s*[^;]+/g);
          if (m) {
            for (const decl of m) {
              const parts = decl.split(':');
              const name = parts[0]?.trim();
              const value = parts.slice(1).join(':')?.trim();
              if (name && name.startsWith('--')) addVar(name, value.replace(/\s*\}$/g, ''), sheet.href || 'inline');
            }
          }
        }
      }
    }

    const computedSubset = (el) => {
      if (!el) return null;
      const cs = getComputedStyle(el);
      const get = (p) => cs.getPropertyValue(p)?.trim() || null;
      const out = {
        display: get('display'),
        position: get('position'),
        flexDirection: get('flex-direction'),
        alignItems: get('align-items'),
        justifyContent: get('justify-content'),
        gap: get('gap'),
        width: get('width'),
        maxWidth: get('max-width'),
        height: get('height'),
        padding: get('padding'),
        margin: get('margin'),
        border: get('border'),
        borderTop: get('border-top'),
        borderRadius: get('border-radius'),
        background: get('background'),
        backgroundColor: get('background-color'),
        color: get('color'),
        boxShadow: get('box-shadow'),
        opacity: get('opacity'),
        fontFamily: get('font-family'),
        fontSize: get('font-size'),
        fontWeight: get('font-weight'),
        lineHeight: get('line-height'),
        letterSpacing: get('letter-spacing'),
        textTransform: get('text-transform'),
        textDecoration: get('text-decoration'),
        outline: get('outline'),
        outlineOffset: get('outline-offset'),
        transitionProperty: get('transition-property'),
        transitionDuration: get('transition-duration'),
        transitionTimingFunction: get('transition-timing-function'),
        fontSmoothing: get('-webkit-font-smoothing'),
      };
      return out;
    };

    const samples = {};
    for (const [k, sel] of Object.entries(selectors)) {
      const el = pick(sel);
      samples[k] = {
        selector: sel,
        exists: Boolean(el),
        computed: computedSubset(el),
      };
    }

    // Typography hierarchy sampling: try h1/h2/p
    const typeSamples = [
      { id: 'h1', sel: 'h1' },
      { id: 'h2', sel: 'h2' },
      { id: 'h3', sel: 'h3' },
      { id: 'p', sel: 'p' },
      { id: 'small', sel: 'small' },
      { id: 'label', sel: 'label' },
    ].map(({ id, sel }) => {
      const el = document.querySelector(sel);
      return { id, selector: sel, exists: Boolean(el), computed: computedSubset(el) };
    });

    return {
      title: document.title || null,
      selectors,
      stylesheets: stylesheetsOut,
      cssVariables,
      keySelectorsSample,
      samples,
      typeSamples,
    };
  }, { selectorCandidates });

  // States (hover/focus) for a selected link/button/input if available.
  const selectors = pageData.selectors || {};
  const stateEvidence = {
    link: { selector: selectors.link, base: null, hover: null, focus: null },
    button: { selector: selectors.button, base: null, hover: null, focus: null, active: null },
    input: { selector: selectors.input, base: null, focus: null },
  };

  async function captureComputed(sel) {
    if (!sel) return null;
    try {
      return await page.evaluate((s) => {
        const el = document.querySelector(s);
        if (!el) return null;
        const cs = getComputedStyle(el);
        const get = (p) => cs.getPropertyValue(p)?.trim() || null;
        return {
          display: get('display'),
          padding: get('padding'),
          border: get('border'),
          borderRadius: get('border-radius'),
          backgroundColor: get('background-color'),
          color: get('color'),
          boxShadow: get('box-shadow'),
          outline: get('outline'),
          transitionProperty: get('transition-property'),
          transitionDuration: get('transition-duration'),
          transitionTimingFunction: get('transition-timing-function'),
          fontFamily: get('font-family'),
          fontSize: get('font-size'),
          fontWeight: get('font-weight'),
          lineHeight: get('line-height'),
          letterSpacing: get('letter-spacing'),
          textTransform: get('text-transform'),
          textDecoration: get('text-decoration'),
        };
      }, sel);
    } catch {
      return null;
    }
  }

  async function captureStates(kind, sel) {
    if (!sel) return;
    stateEvidence[kind].base = await captureComputed(sel);
    try {
      await page.hover(sel, { timeout: 3000 });
      await page.waitForTimeout(200);
      stateEvidence[kind].hover = await captureComputed(sel);
    } catch {
      stateEvidence[kind].hover = null;
    }
    try {
      await page.focus(sel, { timeout: 3000 });
      await page.waitForTimeout(200);
      stateEvidence[kind].focus = await captureComputed(sel);
    } catch {
      stateEvidence[kind].focus = null;
    }
  }

  await captureStates('link', selectors.link);
  await captureStates('button', selectors.button);
  if (selectors.input) {
    stateEvidence.input.base = await captureComputed(selectors.input);
    try {
      await page.focus(selectors.input, { timeout: 3000 });
      await page.waitForTimeout(200);
      stateEvidence.input.focus = await captureComputed(selectors.input);
    } catch {
      stateEvidence.input.focus = null;
    }
  }

  // Derive token candidates from computed samples.
  const colors = [];
  const radii = [];
  const shadows = [];
  const spacings = [];
  const typeScale = [];

  const allComputed = [];
  for (const v of Object.values(pageData.samples || {})) {
    if (v?.computed) allComputed.push(v.computed);
  }
  for (const v of pageData.typeSamples || []) {
    if (v?.computed) allComputed.push(v.computed);
    if (v?.computed?.fontSize) typeScale.push({ id: v.id, ...v.computed });
  }
  for (const c of allComputed) {
    if (c.color) colors.push(c.color);
    if (c.backgroundColor) colors.push(c.backgroundColor);
    if (c.border) {
      const m = String(c.border).match(/(rgb[a]?\([^)]+\)|#[0-9a-fA-F]{3,8})/g);
      if (m) colors.push(...m);
    }
    if (c.borderRadius) radii.push(c.borderRadius);
    if (c.boxShadow) shadows.push(c.boxShadow);
    if (c.padding) spacings.push(...extractPxTokens(c.padding));
    if (c.margin) spacings.push(...extractPxTokens(c.margin));
    if (c.gap) spacings.push(...extractPxTokens(c.gap));
  }

  const colorHex = uniq(colors.map(rgbToHex));
  const radiusVals = uniq(radii).filter((v) => v !== '0px');
  const shadowVals = uniq(shadows).filter((v) => v && v !== 'none');
  const spacingVals = uniq(spacings).filter((v) => v !== '0px');

  const toPxNumber = (v) => {
    const m = String(v).match(/-?\d*\.?\d+/);
    return m ? Number(m[0]) : Number.NaN;
  };
  const sortedSpacing = spacingVals
    .filter((v) => String(v).endsWith('px') && Number.isFinite(toPxNumber(v)))
    .sort((a, b) => toPxNumber(a) - toPxNumber(b));
  const sortedRadius = radiusVals
    .filter((v) => String(v).endsWith('px') && Number.isFinite(toPxNumber(v)))
    .sort((a, b) => toPxNumber(a) - toPxNumber(b));

  // Fonts from type samples + body.
  const fontFamilies = uniq(
    allComputed
      .map((c) => c.fontFamily)
      .filter(Boolean)
      .flatMap((f) => String(f)
        .split(',')
        .map((x) => x.trim().replace(/^["']|["']$/g, ''))
        .filter(Boolean))
  );

  const fonts = fontFamilies.slice(0, 6).map((family) => ({
    family,
    source: family.toLowerCase().includes('airbnb') ? 'self-hosted' : 'unknown',
    weights: uniq(typeScale.map((t) => t.fontWeight).filter(Boolean)),
    styles: [],
  }));

  const cssVarMap = new Map((pageData.cssVariables || []).map((v) => [v.name, v.value]));

  // Attempt to infer layout container.
  let containerEvidence = null;
  try {
    containerEvidence = await page.evaluate(() => {
      const candidates = Array.from(document.querySelectorAll('main, [role="main"], body *')).slice(0, 1500);
      for (const el of candidates) {
        const cs = getComputedStyle(el);
        const mw = cs.getPropertyValue('max-width')?.trim();
        const ml = cs.getPropertyValue('margin-left')?.trim();
        const mr = cs.getPropertyValue('margin-right')?.trim();
        if (mw && mw !== 'none' && (ml === 'auto' || mr === 'auto')) {
          return {
            selector: el.tagName.toLowerCase() + (el.id ? `#${el.id}` : ''),
            maxWidth: mw,
            margin: `${ml} ${mr}`,
            padding: cs.getPropertyValue('padding')?.trim() || null,
          };
        }
      }
      return null;
    });
  } catch {
    containerEvidence = null;
  }

  // Build final schema JSON.
  const out = {
    meta: {
      url: TARGET_URL,
      capturedAt: nowIso(),
      viewport: VIEWPORT,
      notes: [
        ...(metaNotes.length ? metaNotes : []),
        ...(pageData?.stylesheets?.some((s) => s.readable === false)
          ? [
              {
                type: 'css.crossOriginRestrictions',
                message:
                  'Algunas hojas de estilo no permiten leer cssRules desde el navegador (CORS). Se priorizaron estilos computados como evidencia.',
              },
            ]
          : []),
      ],
    },
    sources: {
      stylesheets: (pageData.stylesheets || []).map((s) => ({
        href: s.href || '',
        inline: Boolean(s.inline),
        sizeBytes: typeof s.sizeBytes === 'number' ? s.sizeBytes : 0,
      })),
      fonts,
    },
    tokens: {
      color: {
        palette: {
          neutrals: colorHex.slice(0, 12).map((v, i) => ({ name: `neutral.${i + 1}`, value: v })),
          brand: (() => {
            const candidates = [
              { name: 'palette.rausch', value: cssVarMap.get('--palette-rausch') || null },
              { name: 'palette.productRausch', value: cssVarMap.get('--palette-product-rausch') || null },
              { name: 'palette.plus', value: cssVarMap.get('--palette-plus') || null },
              { name: 'palette.luxe', value: cssVarMap.get('--palette-luxe') || null },
            ].filter((c) => c.value && /^#[0-9A-Fa-f]{6}$/.test(String(c.value).trim()));

            if (candidates.length) return candidates.map((c) => ({ name: c.name, value: String(c.value).trim().toUpperCase() }));

            const primaryHex = rgbToHex(pageData?.samples?.button?.computed?.backgroundColor || '');
            const vals = uniq([primaryHex, ...colorHex.slice(12, 18)]).filter(Boolean);
            return vals.map((v, i) => ({ name: `brand.${i + 1}`, value: v }));
          })(),
          semantic: [
            {
              name: 'text.primary',
              value: pageData?.samples?.body?.computed?.color ?? null,
            },
            {
              name: 'bg.page',
              value: pageData?.samples?.body?.computed?.backgroundColor ?? null,
            },
            {
              name: 'border.default',
              value: pageData?.samples?.input?.computed?.border ?? null,
            },
            {
              name: 'action.primary',
              value: (cssVarMap.get('--palette-rausch') ?? pageData?.samples?.button?.computed?.backgroundColor ?? null),
            },
            { name: 'danger', value: null },
          ],
        },
        usageRules: [],
      },
      typography: {
        scale: (pageData.typeSamples || [])
          .filter((t) => t.exists && t.computed)
          .slice(0, 8)
          .map((t) => ({
            token: `text.${t.id}`,
            fontFamily: t.computed.fontFamily ?? null,
            fontSize: t.computed.fontSize ?? null,
            fontWeight: t.computed.fontWeight ?? null,
            lineHeight: t.computed.lineHeight ?? null,
            letterSpacing: t.computed.letterSpacing ?? null,
            textTransform: t.computed.textTransform ?? null,
            evidence: [
              {
                selector: t.selector,
                computedFrom: 'computed',
                snippet: JSON.stringify(t.computed),
              },
            ],
          })),
        body: {
          fontFamily: pageData?.samples?.body?.computed?.fontFamily ?? null,
          fontSize: pageData?.samples?.body?.computed?.fontSize ?? null,
          lineHeight: pageData?.samples?.body?.computed?.lineHeight ?? null,
        },
      },
      radius: {
        scale: [
          { token: 'radius.sm', value: sortedRadius[0] ?? null, evidence: selectors.button ? [selectors.button] : [] },
          { token: 'radius.md', value: sortedRadius[1] ?? sortedRadius[0] ?? null, evidence: selectors.input ? [selectors.input] : [] },
          { token: 'radius.lg', value: sortedRadius[2] ?? sortedRadius[1] ?? null, evidence: selectors.card ? [selectors.card] : [] },
          { token: 'radius.pill', value: radiusVals.find((r) => String(r).includes('999')) ?? null, evidence: [] },
        ].map((x) => ({ ...x, evidence: x.evidence.map((s) => ({ selector: s, computedFrom: 'computed', snippet: '' })) })),
      },
      spacing: {
        scale: [
          { token: 'space.1', value: sortedSpacing[0] ?? null, evidence: selectors.button ? [selectors.button] : [] },
          { token: 'space.2', value: sortedSpacing[1] ?? sortedSpacing[0] ?? null, evidence: selectors.input ? [selectors.input] : [] },
        ].map((x) => ({ ...x, evidence: x.evidence.map((s) => ({ selector: s, computedFrom: 'computed', snippet: '' })) })),
      },
      shadow: {
        scale: [
          { token: 'shadow.sm', value: shadowVals[0] ?? null, evidence: selectors.card ? [selectors.card] : [] },
          { token: 'shadow.md', value: shadowVals[1] ?? shadowVals[0] ?? null, evidence: selectors.card ? [selectors.card] : [] },
          { token: 'shadow.lg', value: shadowVals[2] ?? shadowVals[1] ?? null, evidence: selectors.card ? [selectors.card] : [] },
        ].map((x) => ({ ...x, evidence: x.evidence.map((s) => ({ selector: s, computedFrom: 'computed', snippet: '' })) })),
      },
      border: {
        widths: [{ token: 'border.1', value: '1px' }],
        styles: [{ token: 'border.solid', value: 'solid' }],
      },
      motion: {
        durations: [
          {
            token: 'duration.fast',
            value: stateEvidence.button.base?.transitionDuration ?? pageData?.samples?.button?.computed?.transitionDuration ?? null,
          },
        ],
        easings: [
          {
            token: 'ease.standard',
            value:
              stateEvidence.button.base?.transitionTimingFunction ??
              pageData?.samples?.button?.computed?.transitionTimingFunction ??
              null,
          },
        ],
      },
      breakpoints: {
        values: [
          { token: 'bp.sm', value: null },
          { token: 'bp.md', value: null },
          { token: 'bp.lg', value: null },
        ],
      },
    },
    layout: {
      page: {
        background: pageData?.samples?.body?.computed?.backgroundColor ?? null,
        maxWidth: containerEvidence?.maxWidth ?? null,
        gutter: containerEvidence?.padding ?? null,
        containerSelectors: containerEvidence?.selector ? [containerEvidence.selector] : [],
        evidence: containerEvidence
          ? [
              {
                selector: containerEvidence.selector,
                computedFrom: 'computed',
                snippet: JSON.stringify(containerEvidence),
              },
            ]
          : [],
      },
      gridAndFlexPatterns: [],
    },
    components: [
      {
        id: 'component.button.1',
        name: 'Button',
        selectors: selectors.button ? [selectors.button] : [],
        base: {
          display: pageData?.samples?.button?.computed?.display ?? null,
          padding: pageData?.samples?.button?.computed?.padding ?? null,
          borderRadius: pageData?.samples?.button?.computed?.borderRadius ?? null,
          border: pageData?.samples?.button?.computed?.border ?? null,
          background: pageData?.samples?.button?.computed?.backgroundColor ?? null,
          color: pageData?.samples?.button?.computed?.color ?? null,
          font: {
            fontFamily: pageData?.samples?.button?.computed?.fontFamily ?? null,
            fontSize: pageData?.samples?.button?.computed?.fontSize ?? null,
            fontWeight: pageData?.samples?.button?.computed?.fontWeight ?? null,
            lineHeight: pageData?.samples?.button?.computed?.lineHeight ?? null,
            letterSpacing: pageData?.samples?.button?.computed?.letterSpacing ?? null,
            textTransform: pageData?.samples?.button?.computed?.textTransform ?? null,
          },
          shadow: pageData?.samples?.button?.computed?.boxShadow ?? null,
          gap: pageData?.samples?.button?.computed?.gap ?? null,
        },
        states: {
          hover: stateEvidence.button.hover ?? null,
          active: stateEvidence.button.active ?? null,
          focus: stateEvidence.button.focus ?? null,
          disabled: null,
        },
        tokensUsed: [],
        evidence: [
          {
            selector: selectors.button || '',
            computedFrom: 'computed',
            snippet: JSON.stringify({ base: stateEvidence.button.base, hover: stateEvidence.button.hover, focus: stateEvidence.button.focus }),
          },
        ],
      },
      {
        id: 'component.link.1',
        name: 'Link',
        selectors: selectors.link ? [selectors.link] : [],
        base: {
          display: pageData?.samples?.link?.computed?.display ?? null,
          padding: pageData?.samples?.link?.computed?.padding ?? null,
          borderRadius: pageData?.samples?.link?.computed?.borderRadius ?? null,
          border: pageData?.samples?.link?.computed?.border ?? null,
          background: pageData?.samples?.link?.computed?.backgroundColor ?? null,
          color: pageData?.samples?.link?.computed?.color ?? null,
          font: {
            fontFamily: pageData?.samples?.link?.computed?.fontFamily ?? null,
            fontSize: pageData?.samples?.link?.computed?.fontSize ?? null,
            fontWeight: pageData?.samples?.link?.computed?.fontWeight ?? null,
            lineHeight: pageData?.samples?.link?.computed?.lineHeight ?? null,
            letterSpacing: pageData?.samples?.link?.computed?.letterSpacing ?? null,
            textTransform: pageData?.samples?.link?.computed?.textTransform ?? null,
          },
          shadow: pageData?.samples?.link?.computed?.boxShadow ?? null,
          gap: pageData?.samples?.link?.computed?.gap ?? null,
        },
        states: {
          hover: stateEvidence.link.hover ?? null,
          active: null,
          focus: stateEvidence.link.focus ?? null,
          disabled: null,
        },
        tokensUsed: [],
        evidence: [
          {
            selector: selectors.link || '',
            computedFrom: 'computed',
            snippet: JSON.stringify({ base: stateEvidence.link.base, hover: stateEvidence.link.hover, focus: stateEvidence.link.focus }),
          },
        ],
      },
      {
        id: 'component.input.1',
        name: 'Input',
        selectors: selectors.input ? [selectors.input] : [],
        base: {
          display: pageData?.samples?.input?.computed?.display ?? null,
          padding: pageData?.samples?.input?.computed?.padding ?? null,
          borderRadius: pageData?.samples?.input?.computed?.borderRadius ?? null,
          border: pageData?.samples?.input?.computed?.border ?? null,
          background: pageData?.samples?.input?.computed?.backgroundColor ?? null,
          color: pageData?.samples?.input?.computed?.color ?? null,
          font: {
            fontFamily: pageData?.samples?.input?.computed?.fontFamily ?? null,
            fontSize: pageData?.samples?.input?.computed?.fontSize ?? null,
            fontWeight: pageData?.samples?.input?.computed?.fontWeight ?? null,
            lineHeight: pageData?.samples?.input?.computed?.lineHeight ?? null,
            letterSpacing: pageData?.samples?.input?.computed?.letterSpacing ?? null,
            textTransform: pageData?.samples?.input?.computed?.textTransform ?? null,
          },
          shadow: pageData?.samples?.input?.computed?.boxShadow ?? null,
          gap: pageData?.samples?.input?.computed?.gap ?? null,
        },
        states: {
          hover: null,
          active: null,
          focus: stateEvidence.input.focus ?? null,
          disabled: null,
        },
        tokensUsed: [],
        evidence: [
          {
            selector: selectors.input || '',
            computedFrom: 'computed',
            snippet: JSON.stringify({ base: stateEvidence.input.base, focus: stateEvidence.input.focus }),
          },
        ],
      },
    ],
    global: {
      htmlBody: {
        fontSmoothing: pageData?.samples?.body?.computed?.fontSmoothing ?? null,
        background: pageData?.samples?.body?.computed?.backgroundColor ?? null,
        color: pageData?.samples?.body?.computed?.color ?? null,
      },
      links: {
        default: stateEvidence.link.base ?? {},
        hover: stateEvidence.link.hover ?? {},
      },
      forms: {
        inputs: stateEvidence.input.base ?? {},
        labels: (pageData.typeSamples || []).find((t) => t.id === 'label')?.computed ?? {},
      },
    },
    raw: {
      cssVariables: pageData.cssVariables || [],
      keySelectorsSample: pageData.keySelectorsSample || [],
    },
  };

  const MAX_RAW_VARS = parseIntEnv('STYLE_EXTRACTOR_MAX_RAW_VARS', 250);
  const shouldTruncate = Number.isFinite(MAX_RAW_VARS) && MAX_RAW_VARS > 0;
  if (shouldTruncate && out.raw.cssVariables.length > MAX_RAW_VARS) {
    out.meta.notes.push({
      type: 'raw.cssVariables.truncated',
      message: `raw.cssVariables fue truncado a ${MAX_RAW_VARS} entradas por límites de tamaño de salida; los tokens se derivan principalmente de estilos computados.`,
      originalCount: out.raw.cssVariables.length,
      keptCount: MAX_RAW_VARS,
    });
    out.raw.cssVariables = out.raw.cssVariables.slice(0, MAX_RAW_VARS);
  }

  // Validate critical missing data.
  const missing = [];
  if (!selectors.button) missing.push('No se encontró un botón visible para muestrear.');
  if (!selectors.link) missing.push('No se encontró un link visible para muestrear.');
  if (!selectors.input) missing.push('No se encontró un input/combobox visible para muestrear.');
  if (missing.length) out.meta.notes.push({ type: 'sampling.missingElements', message: missing.join(' ') });

  // Breakpoints inference is often blocked; explain if still null.
  if (out.tokens.breakpoints.values.every((b) => b.value == null)) {
    out.meta.notes.push({
      type: 'breakpoints.unresolved',
      message:
        'No se pudieron inferir breakpoints (media queries/vars) de forma confiable desde el DOM/CSS accesible; se dejan en null.',
    });
  }

  // Attach a small resource summary (CSS/font requests seen).
  const cssReqs = responses.filter((r) => (r.contentType || '').includes('text/css')).map((r) => r.url);
  const fontReqs = responses
    .filter((r) => (r.contentType || '').includes('font') || (r.contentType || '').includes('woff'))
    .map((r) => r.url);
  if (cssReqs.length || fontReqs.length) {
    out.meta.notes.push({
      type: 'network.observedResources',
      cssCount: cssReqs.length,
      fontCount: fontReqs.length,
      sampleCssUrls: cssReqs.slice(0, 5),
      sampleFontUrls: fontReqs.slice(0, 5),
    });
  }
    process.stdout.write(JSON.stringify(out, null, 2));
  } finally {
    try {
      await browser.close();
    } catch {
      // ignore
    }
  }
}

main().catch((e) => {
  const out = {
    meta: {
      url: TARGET_URL,
      capturedAt: nowIso(),
      viewport: VIEWPORT,
      notes: [{ type: 'fatal', message: String(e?.stack || e?.message || e) }],
    },
    sources: { stylesheets: [], fonts: [] },
    tokens: {
      color: { palette: { neutrals: [], brand: [], semantic: [] }, usageRules: [] },
      typography: { scale: [], body: { fontFamily: null, fontSize: null, lineHeight: null } },
      radius: { scale: [] },
      spacing: { scale: [] },
      shadow: { scale: [] },
      border: { widths: [], styles: [] },
      motion: { durations: [], easings: [] },
      breakpoints: { values: [] },
    },
    layout: { page: { background: null, maxWidth: null, gutter: null, containerSelectors: [], evidence: [] }, gridAndFlexPatterns: [] },
    components: [],
    global: { htmlBody: { fontSmoothing: null, background: null, color: null }, links: { default: {}, hover: {} }, forms: { inputs: {}, labels: {} } },
    raw: { cssVariables: [], keySelectorsSample: [] },
  };
  process.stdout.write(JSON.stringify(out, null, 2));
  process.exit(0);
});

