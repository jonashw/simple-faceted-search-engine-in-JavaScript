import {Query} from './types';
export default {
    setFacetTerms: (query: Query, facet_id: string, terms: string[]): Query => {
      let newQuery = { ...query, [facet_id]: terms }
      if (newQuery[facet_id].length === 0) {
        delete newQuery[facet_id];
      }
      return newQuery;
    },
    toggleFacetTerm: (query: Query, facetKey: string, term: string) => {
      let existingFacetTerms = query[facetKey] || [];
      let newFacetTerms =
        existingFacetTerms.indexOf(term) > -1
          ? existingFacetTerms.filter((t) => t !== term)
          : [...existingFacetTerms, term];
      let newQuery = { ...query, [facetKey]: newFacetTerms };
      if (newQuery[facetKey].length === 0) {
        delete newQuery[facetKey];
      }
      return newQuery;
    }
};