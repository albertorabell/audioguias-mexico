import { defineGroup } from '../define';

export const search = defineGroup(
  {
    placeholder: 'Buscar por obra o sala (ej. Sol, Mexica, Pakal)…',
    clear: 'Borrar texto',
    closeAria: 'Cerrar búsqueda',
    resultsFound: (n: number) => `${n} ${n === 1 ? 'resultado encontrado' : 'resultados encontrados'}`,
    catalog: (n: number) => `Catálogo del museo (${n} obras)`,
    directMatches: 'Coincidencias directas',
    featured: 'Obras destacadas',
    noResults: (q: string) => `No se encontraron piezas para «${q}»`,
    noResultsHint: 'Prueba buscando por nombre de cultura, de sala o palabras clave como «monolito», «máscara» o «jade».',
    view: 'Ver',
  },
  {
    placeholder: 'Search by work or room (e.g. Sun, Mexica, Pakal)…',
    clear: 'Clear text',
    closeAria: 'Close search',
    resultsFound: (n: number) => `${n} ${n === 1 ? 'result found' : 'results found'}`,
    catalog: (n: number) => `Museum catalogue (${n} works)`,
    directMatches: 'Direct matches',
    featured: 'Featured works',
    noResults: (q: string) => `No pieces found for “${q}”`,
    noResultsHint: 'Try a culture name, a room name or keywords like “monolith”, “mask” or “jade”.',
    view: 'View',
  },
  {
    placeholder: 'Rechercher une œuvre ou une salle (ex. Soleil, Mexica, Pakal)…',
    clear: 'Effacer le texte',
    closeAria: 'Fermer la recherche',
    resultsFound: (n: number) => `${n} ${n === 1 ? 'résultat trouvé' : 'résultats trouvés'}`,
    catalog: (n: number) => `Catalogue du musée (${n} œuvres)`,
    directMatches: 'Correspondances directes',
    featured: 'Œuvres à la une',
    noResults: (q: string) => `Aucune pièce trouvée pour « ${q} »`,
    noResultsHint: 'Essayez avec le nom d’une culture ou d’une salle, ou des mots-clés comme « monolithe », « masque » ou « jade ».',
    view: 'Voir',
  }
);
