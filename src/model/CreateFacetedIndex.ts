import {
  FacetedIndexConfig,
  FacetedIndexInstance,
  HierarchicalTermBucket,
  RecordWithMetadata,
  SearchResult ,
  RecordValue,
  Query
} from './types';

import {unionAll,intersectAll } from './SetOperations';

const GetDefaultSearchResult = (): SearchResult => 
({
  query: {},
  records: [],
  facets: [],
  facetHierarchies: [],
  facetTermCount: (f,t) => 0,
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
const CreateFacetedIndex = (
  records: {[key: string]: any}[],
  config: FacetedIndexConfig
): FacetedIndexInstance => {
  const candidate_facet_fields = new Set<string>();
  const expectedFacetIds =
    !!config && Array.isArray(config.facet_fields)
      ? new Set(config.facet_fields)
      : new Set();


  const allowableFacetId = (id: string) =>
    expectedFacetIds.size === 0 || expectedFacetIds.has(id);

  var ix: {[facetId: string]: {[term: string]: Set<number>}} = {};
  let termsDict: {[term: string]: string} = {};

  const traverseFacetUpwards = (facetId: string, term: string, recordId: number): void => {
    if(!(facetId in config.facet_term_parents)){
      return;
    }
    if(!(term in config.facet_term_parents[facetId])){
      //console.log('no parent term found for ' + term);
      return;
    }
    let parentTerm = config.facet_term_parents[facetId][term];
    ix[facetId][parentTerm] = ix[facetId][parentTerm] || new Set<number>();
    ix[facetId][parentTerm].add(recordId);
    termsDict[parentTerm] = parentTerm;
    traverseFacetUpwards(facetId, parentTerm, recordId);
  };

  let record_id = 0;
  let all_ids: number[] = [];
  let record_tags: {[recordId: number]: RecordValue} = {};

  for (let record of records) {
    record_tags[record_id] = {};
    for (let fieldName of Object.keys(record)) {
      candidate_facet_fields.add(fieldName);
      if (!allowableFacetId(fieldName)) {
        continue;
      }
      ix[fieldName] = ix[fieldName] || {};
      let terms = 
        Array.isArray(record[fieldName])
        ? record[fieldName]
        : [record[fieldName]];
      record_tags[record_id][fieldName] = terms;
      for (let term of terms) {
        ix[fieldName][term] = ix[fieldName][term] || new Set();
        ix[fieldName][term].add(record_id);
        termsDict[term] = term;
        traverseFacetUpwards(fieldName, term, record_id);
      }
    }
    all_ids.push(record_id);
    record_id++;
  }

  const terms = Object.keys(termsDict);
  const facetIds = Object.keys(ix).filter(allowableFacetId);

  const process = (() => {
    let searchable_text: string[] = [];//TODO
    if(!config || !Array.isArray(config.display_fields) || config.display_fields.length === 0){
      return (
        (id: number, r: {}): RecordWithMetadata => ({
          id,
          tags: record_tags[id],
          searchable_text,
          paired_down_record: r,
          original_record: r
        }));
    }
    var dfields = new Set(config.display_fields);
    //console.log('dfields',dfields);
    return (id: number, r: {}): RecordWithMetadata => {
      var displayEntries = 
        Object.entries(r).filter(([k,v]) => dfields.has(k));
      return {
        id: id,
        paired_down_record: Object.fromEntries(displayEntries) as RecordValue,
        original_record: r,
        tags: record_tags[id],
        searchable_text
      };
    };
  })();

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
      let a = selector(itemA);
      let b = selector(itemB);
      return a < b ? -1 : a > b ? 1 : 0;
    })
  }

  const search = (query: Query): SearchResult => {
    var matching_ids =
      Object.keys(query).length === 0
        ? new Set(all_ids)
        : record_ids_matching_query(query);
    var matching_ids_independent_of_facet = Object.fromEntries(
      Object.keys(ix).map((facet_id) => {
        var query_minus_this_facet = Object.fromEntries(
          Object.entries(query).filter(([k, v]) => k !== facet_id)
        );
        return [facet_id, record_ids_matching_query(query_minus_this_facet)];
      })
    );
    var facets = Object.entries(ix).map(([facet_id, ids_by_term]) => {
      let term_buckets = Object.entries(ids_by_term)
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

    let facetHierarchies = Object.entries(ix).map(([facet_id, ids_by_term]) => {
      let term_buckets: HierarchicalTermBucket[] = Object.entries(ids_by_term)
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
      let byParentTerm: {[parentTerm: string]: HierarchicalTermBucket[]} = {};
      const ROOT_ID = 'ROOT_' + new Date().getTime();
      for(let b of term_buckets){
        if(!(b.facet_id in config.facet_term_parents)){
          continue;
        }
        let parentTerm = 
          (b.term in config.facet_term_parents[b.facet_id])
          ? config.facet_term_parents[b.facet_id][b.term]
          : ROOT_ID;//top-level terms have the singleton parent
        byParentTerm[parentTerm] = byParentTerm[parentTerm] || [];
        byParentTerm[parentTerm].push(b);
      }

      const alphaSortTermBuckets = (tbs: HierarchicalTermBucket[]): HierarchicalTermBucket[] =>
        sortBy(tbs, b => b.term);

      for(let b of term_buckets){
        if(!(b.term in byParentTerm)){
          continue;
        }
        b.children = alphaSortTermBuckets(byParentTerm[b.term]);
      }

      return (ROOT_ID in byParentTerm)
        ? { facet_id, term_buckets: alphaSortTermBuckets(byParentTerm[ROOT_ID])}
        : { facet_id, term_buckets: alphaSortTermBuckets(term_buckets) };
    }) || [];

    let term_buckets_by_facet_id = Object.fromEntries((facets || []).map(f => [
      f.facet_id,
      Object.fromEntries(f.term_buckets.map(tb => [tb.term, tb]))
    ]));

    let terms = facets.flatMap(f => 
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
      records: Array.from(matching_ids).map((record_id) => process(record_id, records[record_id]))
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
    },
    display_fields: candidate_facet_fields,
    candidate_facet_fields,
    data: ix,
    terms
  };
};

export {GetDefaultSearchResult, CreateFacetedIndex };