import {
  FacetedIndexConfig,
  FacetedIndexInstance,
  HierarchicalTermBucket,
  RecordWithMetadata,
  SearchResult ,
  RecordValue,
  Query,
  TextIndex
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

  const allowableFacetId = (id: string) =>
    config.fields.facet.size === 0 || config.fields.facet.has(id);

  var facetTermIndex: {[facetId: string]: {[term: string]: Set<number>}} = {};
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
    facetTermIndex[facetId][parentTerm] = facetTermIndex[facetId][parentTerm] || new Set<number>();
    facetTermIndex[facetId][parentTerm].add(recordId);
    termsDict[parentTerm] = parentTerm;
    traverseFacetUpwards(facetId, parentTerm, recordId);
  };

  let record_id = 0;
  let all_record_ids: number[] = [];
  let record_tags: {[recordId: number]: RecordValue} = {};

  for (let record of records) {
    record_tags[record_id] = {};
    for (let fieldName of Object.keys(record)) {
      candidate_facet_fields.add(fieldName);
      if (!allowableFacetId(fieldName)) {
        continue;
      }
      facetTermIndex[fieldName] = facetTermIndex[fieldName] || {};
      let terms = 
        Array.isArray(record[fieldName])
        ? record[fieldName]
        : [record[fieldName]];
      record_tags[record_id][fieldName] = terms;
      for (let term of terms) {
        facetTermIndex[fieldName][term] = facetTermIndex[fieldName][term] || new Set();
        facetTermIndex[fieldName][term].add(record_id);
        termsDict[term] = term;
        traverseFacetUpwards(fieldName, term, record_id);
      }
    }
    all_record_ids.push(record_id);
    record_id++;
  }

  const terms = Object.keys(termsDict);
  const facetIds = Object.keys(facetTermIndex).filter(allowableFacetId);

  const process = (() => {
    /*
    **
    */
    var dfields = 
      !config || config.fields.display.size === 0
      ? undefined
      : config.fields.display;
    return (
      (id: number, r: {}): RecordWithMetadata => {
        let recordEntriesForDisplay = 
          dfields === undefined 
          ? Object.entries(r)
          : Object.entries(r).filter(([k,v]) => dfields?.has(k));
        let searchable_text: string[] = [];
        for(let [k,v] of recordEntriesForDisplay){
          if(typeof v === "string" || typeof v === "number"){
            searchable_text.push(v.toString());
          } else if(Array.isArray(v)){
            for(let vv of v){
              if(typeof vv === "string" || typeof vv === "number"){
                searchable_text.push(vv.toString());
              }
            }
          }
        }
        return ({
          id,
          tags: record_tags[id],
          searchable_text,
          paired_down_record: dfields === undefined ? r : Object.fromEntries(recordEntriesForDisplay),
          original_record: r
        });
      }
    );
  })();

  let records_with_metadata = all_record_ids.map(id => process(id, records[id]));

  const record_ids_matching_query = (
    textIndex: TextIndex,
    query: Query,
    searchString: string | undefined
  ): Set<number> => {
    //console.log(JSON.stringify({query,searchString},null,2));
    let facetMatches = 
      Object.keys(query).length === 0
      ? new Set(all_record_ids)
      : intersectAll(
        facetIds
          .map((facetId) => {
            //queries may specify multiple values per facet...
            //...a record tagged with ANY of these terms should be consider a match.  (OR logic)
            return unionAll(
              (query[facetId] || []).map((term) => facetTermIndex[facetId][term] || new Set<number>([]))
            );
          })
          .filter((s) => s.size > 0));
    if(!searchString){
      return facetMatches;
    }
    let searchStringMatches = textIndex.filter(r => r.text.indexOf(searchString) > -1).map(r => r.record_id);
    //console.log({searchStringMatches})
    return intersectAll([facetMatches, new Set<number>(searchStringMatches)]);
  };

  function sortBy<T>(arr: T[], selector: (item: T) => any): T[] {
    return arr.sort((itemA,itemB) => {
      let a = selector(itemA);
      let b = selector(itemB);
      return a < b ? -1 : a > b ? 1 : 0;
    })
  }

  const text_index: TextIndex = records_with_metadata.map(r => ({
    text: r.searchable_text.join(' '),
    record_id: r.id
  }));

  const search = (query: Query, searchKeyWord: string | undefined): SearchResult => {
    var matching_ids_independent_of_facet = Object.fromEntries(
      Object.keys(facetTermIndex).map((facet_id) => {
        var query_minus_this_facet = Object.fromEntries(
          Object.entries(query).filter(([k, v]) => k !== facet_id)
        );
        return [facet_id, record_ids_matching_query(text_index, query_minus_this_facet,searchKeyWord)];
      })
    );
    var facets = Object.entries(facetTermIndex).map(([facet_id, ids_by_term]) => {
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

    let facetHierarchies = Object.entries(facetTermIndex).map(([facet_id, ids_by_term]) => {
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

    var matching_ids = record_ids_matching_query(text_index,query,searchKeyWord);

    return {
      query: { ...query },
      facets: facets || [],
      facetHierarchies,
      terms,
      term_buckets_by_facet_id,
      facetTermCount: (facet: string, term: string) => 
        //((facetTermIndex.data[facet] || new Set())[term]  || new Set()).size;
        ((term_buckets_by_facet_id[facet] || {})[term]  || {count:0}).count,
      records: Array.from(matching_ids).map((record_id) => records_with_metadata[record_id])
    };
  };

  return {
    search,
    text_index,
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
    data: facetTermIndex,
    terms
  };
};

export {GetDefaultSearchResult, CreateFacetedIndex };