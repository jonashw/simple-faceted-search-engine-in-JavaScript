import { FacetTermParents, FacetTermRecordIndex, HierarchicalTermBucket, Query, RecordWithMetadata, SearchResult, TextIndex } from "./types";

import {unionAll,intersectAll } from './SetOperations';

function sortBy<T>(arr: T[], selector: (item: T) => any): T[] {
  return arr.sort((itemA,itemB) => {
    let a = selector(itemA);
    let b = selector(itemB);
    return a < b ? -1 : a > b ? 1 : 0;
  })
}


const alphaSortTermBuckets = (tbs: HierarchicalTermBucket[]): HierarchicalTermBucket[] =>
  sortBy(tbs, b => b.term);

const record_ids_matching_query = (
  facetIds: string[],
  all_record_ids: number[],
  facetTermRecordIndex: FacetTermRecordIndex,
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
            (query[facetId] || []).map((term) => facetTermRecordIndex[facetId][term] || new Set<number>([]))
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



const search = (
  facetIds: string[],
  allRecordIds: number[],
  records_with_metadata: RecordWithMetadata[],
  facetTermRecordIndex: FacetTermRecordIndex,
  facet_term_parents: FacetTermParents,
  text_index: TextIndex,
  query: Query,
  searchKeyWord: string | undefined
): SearchResult => {
  var matching_ids_independent_of_facet = Object.fromEntries(
    Object.keys(facetTermRecordIndex).map((facet_id) => {
      var query_minus_this_facet = Object.fromEntries(
        Object.entries(query).filter(([k, v]) => k !== facet_id)
      );
      return [
        facet_id,
        record_ids_matching_query(
          facetIds,
          allRecordIds,
          facetTermRecordIndex,
          text_index,
          query_minus_this_facet,searchKeyWord
        )
      ];
    })
  );
  var facets = Object.entries(facetTermRecordIndex).map(([facet_id, ids_by_term]) => {
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

  let facetHierarchies = Object.entries(facetTermRecordIndex).map(([facet_id, ids_by_term]) => {
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
      if(!(b.facet_id in facet_term_parents)){
        continue;
      }
      let parentTerm = 
        (b.term in facet_term_parents[b.facet_id])
        ? facet_term_parents[b.facet_id][b.term]
        : ROOT_ID;//top-level terms have the singleton parent
      byParentTerm[parentTerm] = byParentTerm[parentTerm] || [];
      byParentTerm[parentTerm].push(b);
    }

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

  var matching_ids = record_ids_matching_query(
    facetIds,
    allRecordIds,
    facetTermRecordIndex,
    text_index,
    query,
    searchKeyWord);

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

export default search;