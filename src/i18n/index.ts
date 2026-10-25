import type { SupportedLanguage } from './languages';
import { common } from './groups/common';
import { chrome } from './groups/chrome';
import { home } from './groups/home';
import { player } from './groups/player';
import { errors } from './groups/errors';
import { room } from './groups/room';
import { routes } from './groups/routes';
import { search } from './groups/search';
import { tour } from './groups/tour';
import { offline } from './groups/offline';
import { piece } from './groups/piece';
import { media } from './groups/media';
import { map } from './groups/map';
import { wizard } from './groups/wizard';
import { app } from './groups/app';
import { paywall } from './groups/paywall';
import { ui } from './groups/ui';
import { intro } from './groups/intro';
import { PL_GROUPS } from './pl';
import { SITE_OVERRIDES, SiteKind } from './sitio';
import { getCurrentSiteKind, getCurrentSiteName } from './runtime';

const groups = {
  common,
  chrome,
  home,
  player,
  errors,
  room,
  routes,
  search,
  tour,
  offline,
  piece,
  media,
  map,
  wizard,
  app,
  paywall,
  ui,
  intro,
};

/** Todos los textos de la interfaz, con la forma definida por el español. */
export type Strings = { [K in keyof typeof groups]: (typeof groups)[K]['es'] };

const cache: Partial<Record<string, Strings>> = {};

function mergeGroup(es: any, other: any): any {
  if (!other) return es;
  const out: any = Array.isArray(es) ? [...es] : { ...es };
  for (const k of Object.keys(es)) {
    const v = other[k];
    if (v === undefined || v === null) continue;
    out[k] = es[k] && typeof es[k] === 'object' && !Array.isArray(es[k]) ? mergeGroup(es[k], v) : v;
  }
  return out;
}

/** Textos en el idioma pedido. Lo que falte en ese idioma se muestra en español. */
export function getStrings(lang: SupportedLanguage, kind: SiteKind = getCurrentSiteKind(), siteName: string | null = getCurrentSiteName()): Strings {
  const base = baseStrings(lang, kind);
  return kind === 'site' && siteName ? withSiteName(base, siteName) : base;
}

/** Los textos con el nombre del sitio abierto en lugar del de Teotihuacán (que es el que traen las palabras de «sitio»). */
function withSiteName(base: Strings, name: string): Strings {
  return {
    ...base,
    common: { ...base.common, museumName: name },
    chrome: { ...base.chrome, nav: { ...base.chrome.nav, museumName: name.toUpperCase() } },
  };
}

function baseStrings(lang: SupportedLanguage, kind: SiteKind): Strings {
  const key = `${lang}:${kind}`;
  if (cache[key]) return cache[key]!;
  const out: any = {};
  for (const [name, g] of Object.entries(groups) as [string, any][]) {
    out[name] = lang === 'es' ? g.es : mergeGroup(g.es, g[lang] ?? (lang === 'pl' ? PL_GROUPS[name] : undefined));
  }
  if (kind === 'site') {
    // Palabras de sitio arqueológico: primero las del español y encima las del idioma (si las hay)
    for (const over of [SITE_OVERRIDES.es, lang !== 'es' ? SITE_OVERRIDES[lang] : undefined]) {
      if (!over) continue;
      for (const name of Object.keys(over)) out[name] = mergeGroup(out[name], over[name]);
    }
  }
  cache[key] = out as Strings;
  return cache[key]!;
}
