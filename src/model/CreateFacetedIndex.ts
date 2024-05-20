import {
  BaseRecord,
  FacetedIndexConfig,
  FacetedIndexInstance,
  FieldValue,
  HierarchicalTermBucket,
  Query,
  FacetedIndexData,
  SearchResult 
} from './types';

import {unionAll,intersectAll } from './SetOperations';


const GetDefaultSearchResult = <TRecord extends BaseRecord>(): SearchResult<TRecord> => 
({
  query: {},
  records: [],
  facets: [],
  facetHierarchies: [],
  facetTermCount: () => 0,
  term_buckets_by_facet_id: {},
  terms: []
});

/*
Expectations:
- all records have simple key-value pairs.  
- all record keys are strings
- all record values are simple primitives (string, number) or arrays of primitives
- multi-value fields are not yet supported
*/
const CreateFacetedIndex = <TRecord extends BaseRecord>(
  records: TRecord[],
  config: FacetedIndexConfig
): FacetedIndexInstance<TRecord> => {
  const candidate_facet_fields = new Set<string>();
  const expectedFacetIds =
    !!config && Array.isArray(config.facet_fields)
      ? new Set(config.facet_fields)
      : new Set();

  const convertToDisplayRecord = (() => {
    if(!config || !Array.isArray(config.display_fields) || config.display_fields.length === 0){
      return (r: TRecord): BaseRecord => r;
    }
    const dfields = new Set(config.display_fields);
    //console.log('dfields',dfields);
    return (r: TRecord): BaseRecord => {
      const displayEntries = Object.entries(r).filter(([k]) => dfields.has(k));
      return Object.fromEntries(displayEntries);
    };
  })();

  const allowableFacetId = (id: string) =>
    expectedFacetIds.size === 0 || expectedFacetIds.has(id);

  const ix: FacetedIndexData = {};
  let i = 0;
  const all_ids: number[] = [];
  const display_records: BaseRecord[] = [];
  const termsDict: {[term: string]: string} = {};

  const traverseFacetUpwards = (facetId: string, term: FieldValue, recordId: number): void => {
    if(!(facetId in config.facet_term_parents)){
      return;
    }
    if(!(term in config.facet_term_parents[facetId])){
      //console.log('no parent term found for ' + term);
      return;
    }
    const parentTerm = config.facet_term_parents[facetId][term];
    ix[facetId][parentTerm] = ix[facetId][parentTerm] || new Set<number>();
    ix[facetId][parentTerm].add(recordId);
    termsDict[parentTerm] = parentTerm;
    traverseFacetUpwards(facetId, parentTerm, recordId);
  };

  for (const record of records) {
    for (const fieldName of Object.keys(record)) {
      candidate_facet_fields.add(fieldName);
      if (!allowableFacetId(fieldName)) {
        continue;
      }
      ix[fieldName] = ix[fieldName] || {};
      const fieldValue = record[fieldName];
      const terms: FieldValue[] = 
        Array.isArray(fieldValue)
        ? fieldValue
        : [fieldValue];
      for (const term of terms) {
        ix[fieldName][term] = ix[fieldName][term] || new Set();
        ix[fieldName][term].add(i);
        termsDict[term] = term.toString();
        traverseFacetUpwards(fieldName, term, i);
      }
    }
    display_records.push(convertToDisplayRecord(record));
    all_ids.push(i);
    i++;
  }

  const terms = Object.keys(termsDict);

  const facetIds = Object.keys(ix).filter(allowableFacetId);

  const record_ids_matching_query = (query: Query): Set<number> => {
    //alert(JSON.stringify(query,null,2))
    return intersectAll(
      facetIds
        .map((facetId) => {
          //queries may specify multiple values per facet...
          //...a record tagged with ANY of these terms should be consider a match.  (OR logic)
          return unionAll(
            (query[facetId] || []).map((term) => ix[facetId][term] || new Set<number>([]))
          );
        })
        .filter((s) => s.size > 0)
    );
  };

  function sortBy<T>(arr: T[], selector: (item: T) => any): T[] {
    return arr.sort((itemA,itemB) => {
      const a = selector(itemA);
      const b = selector(itemB);
      return a < b ? -1 : a > b ? 1 : 0;
    })
  }

  const search = (query: Query): SearchResult<TRecord> => {
    const matching_ids =
      Object.keys(query).length === 0
        ? new Set(all_ids)
        : record_ids_matching_query(query);
    const matching_ids_independent_of_facet = Object.fromEntries(
      Object.keys(ix).map((facet_id) => {
        const query_minus_this_facet = Object.fromEntries(
          Object.entries(query).filter(([k]) => k !== facet_id)
        );
        return [facet_id, record_ids_matching_query(query_minus_this_facet)];
      })
    );
    const facets = Object.entries(ix).map(([facet_id, ids_by_term]) => {
      const term_buckets = Object.entries(ids_by_term)
        .map(([term, ids_matching_term]) => ({
          term: term,
          facet_id: facet_id,
          in_query: facet_id in query && query[facet_id].indexOf(term) > -1,
          count: intersectAll(
            [
              matching_ids_independent_of_facet[facet_id],
              ids_matching_term
            ].filter((s) => s.size > 0)
          ).size
        }))
        .filter((term) => term.count > 0 || term.in_query);
      return {
        facet_id,
        term_buckets: sortBy(term_buckets, b => b.term)
      };
    }) || [];

    const facetHierarchies = Object.entries(ix).map(([facet_id, ids_by_term]) => {
      const term_buckets: HierarchicalTermBucket[] = Object.entries(ids_by_term)
        .map(([term, ids_matching_term]) => ({
          term: term,
          children: [],
          facet_id: facet_id,
          in_query: facet_id in query && query[facet_id].indexOf(term) > -1,
          count: intersectAll(
            [
              matching_ids_independent_of_facet[facet_id],
              ids_matching_term
            ].filter((s) => s.size > 0)
          ).size
        }))
        .filter((term) => term.count > 0 || term.in_query);
      const byParentTerm: {[parentTerm: string]: HierarchicalTermBucket[]} = {};
      const ROOT_ID = 'ROOT_' + new Date().getTime();
      for(const b of term_buckets){
        if(!(b.facet_id in config.facet_term_parents)){
          continue;
        }
        const parentTerm = 
          (b.term in config.facet_term_parents[b.facet_id])
          ? config.facet_term_parents[b.facet_id][b.term]
          : ROOT_ID;//top-level terms have the singleton parent
        byParentTerm[parentTerm] = byParentTerm[parentTerm] || [];
        byParentTerm[parentTerm].push(b);
      }

      const alphaSortTermBuckets = (tbs: HierarchicalTermBucket[]): HierarchicalTermBucket[] =>
        sortBy(tbs, b => b.term);

      for(const b of term_buckets){
        if(!(b.term in byParentTerm)){
          continue;
        }
        b.children = alphaSortTermBuckets(byParentTerm[b.term]);
      }

      return (ROOT_ID in byParentTerm)
        ? { facet_id, term_buckets: alphaSortTermBuckets(byParentTerm[ROOT_ID])}
        : { facet_id, term_buckets: alphaSortTermBuckets(term_buckets) };
    }) || [];

    const term_buckets_by_facet_id = Object.fromEntries((facets || []).map(f => [
      f.facet_id,
      Object.fromEntries(f.term_buckets.map(tb => [tb.term, tb]))
    ]));

    const terms = facets.flatMap(f => 
      f.term_buckets.map(tb => 
        Object.assign({}, tb, {facet_id: f.facet_id})));

    return {
      query: { ...query },
      facets: facets || [],
      facetHierarchies,
      terms,
      term_buckets_by_facet_id,
      facetTermCount: (facet: string, term: string) => 
        //((ix.data[facet] || new Set())[term]  || new Set()).size;
        ((term_buckets_by_facet_id[facet] || {})[term]  || {count:0}).count,
      records: Array.from(matching_ids).map((i) => records[i])
    };
  };

  return {
    search,
    actual_facet_fields: facetIds,
    getResultsPage: (results, pageNumber, pageSize) => 
      results.slice(
        (pageNumber-1)*pageSize,
        (pageNumber-0)*pageSize),
    toggleQueryTerm: (query, facetKey, term) => {
      const existingFacetTerms = query[facetKey] || [];
      const newFacetTerms =
        existingFacetTerms.indexOf(term) > -1
          ? existingFacetTerms.filter((t) => t !== term)
          : [...existingFacetTerms, term];
      const newQuery = { ...query, [facetKey]: newFacetTerms };
      if (newQuery[facetKey].length === 0) {
        delete newQuery[facetKey];
      }
      return newQuery;
    },
    display_fields: candidate_facet_fields,
    candidate_facet_fields,
    data: ix,
    terms
  };
};

export {GetDefaultSearchResult, CreateFacetedIndex };