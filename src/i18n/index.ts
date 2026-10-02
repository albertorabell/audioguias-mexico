import type { SupportedLanguage } from './languages';
import { common } from './groups/common';
import { chrome } from './groups/chrome';
import { home } from './groups/home';
import { overview } from './groups/overview';
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
import { liveRoute } from './groups/liveRoute';
import { wizard } from './groups/wizard';
import { app } from './groups/app';
import { paywall } from './groups/paywall';

const groups = {
  common,
  chrome,
  home,
  overview,
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
  liveRoute,
  wizard,
  app,
  paywall,
};

/** Todos los textos de la interfaz, con la forma definida por el español. */
export type Strings = { [K in keyof typeof groups]: (typeof groups)[K]['es'] };

const cache: Partial<Record<SupportedLanguage, Strings>> = {};

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
export function getStrings(lang: SupportedLanguage): Strings {
  if (cache[lang]) return cache[lang]!;
  const out: any = {};
  for (const [name, g] of Object.entries(groups) as [string, any][]) {
    out[name] = lang === 'es' ? g.es : mergeGroup(g.es, g[lang]);
  }
  cache[lang] = out as Strings;
  return cache[lang]!;
}
