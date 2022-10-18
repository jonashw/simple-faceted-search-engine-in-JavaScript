import {unionAll,intersectAll } from './SetOperations';

type FacetedIndexConfig = {
  display_fields: string[],
  facet_fields: string[],
  //The extra level of nesting is just-in-case 2+ facets share a term name
  facet_term_parents: {[facet_id: string]: {[term: string]: string}}
}

const GetDefaultSearchResult = () => 
({
  query: {},
  records: [],
  facets: []
});

type Query = {[facetId: string] : string[]};

type FacetedIndexInstance = {
  search: (query: Query) => SearchResult,
  actual_facet_fields: string[],
  getResultsPage: (results: {}[], pageNumber: number, pageSize: number) => {}[],
  toggleQueryTerm: (query: Query, facetKey: string, term: string) => {},
  display_fields: Set<string>, 
  candidate_facet_fields: Set<string>, 
  data: any,
  terms: any
};

type FacetTermBucket = {facet_id: string, term_buckets: TermBucket[]};
type FacetHierarchicalTermBucket = {
  facet_id: string,
  term_buckets: HierarchicalTermBucket[]
}

type TermBucket = {
  term: string,
  in_query: boolean,
  count: number,
  facet_id: string
};

type HierarchicalTermBucket = {
  term: string,
  children: HierarchicalTermBucket[],
  in_query: boolean,
  count: number,
  facet_id: string
};

type SearchResult = {
  query: Query,
  facets: FacetTermBucket[],
  facetHierarchies: FacetHierarchicalTermBucket[],
  terms: TermBucket[],
  term_buckets_by_facet_id: {[facet_id: string]: {[term: string]: TermBucket}},
  facetTermCount: (facet: string, term: string) => number,
  records: {[key: string]: any}
}

/*
Expectations:
- all records have simple key-value pairs.  
- all record keys are strings
- all record values are simple primitives (string, number) or arrays of primitives
- multi-value fields are not yet supported
*/
const FacetedIndex = (
  records: {[key: string]: any}[],
  config: FacetedIndexConfig
): FacetedIndexInstance => {
  const candidate_facet_fields = new Set<string>();
  const expectedFacetIds =
    !!config && Array.isArray(config.facet_fields)
      ? new Set(config.facet_fields)
      : new Set();

  const convertToDisplayRecord = (() => {
    if(!config || !Array.isArray(config.display_fields) || config.display_fields.length === 0){
      return (r: {}): {} => r;
    }
    var dfields = new Set(config.display_fields);
    //console.log('dfields',dfields);
    return (r: {}): {} => {
      var displayEntries = Object.entries(r).filter(([k,v]) => dfields.has(k));
      return Object.fromEntries(displayEntries);
    };
  })();

  const allowableFacetId = (id: string) =>
    expectedFacetIds.size === 0 || expectedFacetIds.has(id);

  var ix: {[facetId: string]: {[term: string]: Set<number>}} = {};
  let i = 0;
  let all_ids: number[] = [];
  let display_records: {}[] = [];
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

  for (let record of records) {
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
      for (let term of terms) {
        ix[fieldName][term] = ix[fieldName][term] || new Set();
        ix[fieldName][term].add(i);
        termsDict[term] = term;
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
      records: Array.from(matching_ids).map((i) => display_records[i])
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

export {GetDefaultSearchResult, FacetedIndex, FacetedIndexConfig};