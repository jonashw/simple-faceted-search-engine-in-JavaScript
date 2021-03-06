const GetDefaultSearchResult = () => 
({
  query: {},
  records: [],
  facets: []
});

/*
Expectations:
- all records have simple key-value pairs.  
- all record keys are strings
- all record values are simple primitives (string, number)
- multi-value fields are not yet supported
*/
const FacetedIndex = (records, config) => {
  const candidate_facet_fields = new Set();
  const expectedFacetIds =
    !!config && Array.isArray(config.facet_fields)
      ? new Set(config.facet_fields)
      : new Set();

  const convertToDisplayRecord = (() => {
    if(!config || !Array.isArray(config.display_fields) || config.display_fields.length === 0){
      return r => r;
    }
    var dfields = new Set(config.display_fields);
    //console.log('dfields',dfields);
    return r => {
      var displayEntries = Object.entries(r).filter(([k,v]) => dfields.has(k));
      return Object.fromEntries(displayEntries);
    };
  })();

  const allowableFacetId = (id) =>
    expectedFacetIds.size === 0 || expectedFacetIds.has(id);

  var ix = {};
  let i = 0;
  let all_ids = [];
  let display_records = [];
  for (let r of records) {
    for (let k of Object.keys(r)) {
      candidate_facet_fields.add(k);
      if (!allowableFacetId(k)) {
        continue;
      }
      ix[k] = ix[k] || {};
      for (let term of Array.isArray(r[k]) ? r[k] : [r[k]]) {
        ix[k][term] = ix[k][term] || new Set();
        ix[k][term].add(i);
      }
    }
    display_records.push(convertToDisplayRecord(r));
    all_ids.push(i);
    i++;
  }

  const facetIds = Object.keys(ix).filter(allowableFacetId);
  const intersectAll = (sets) => {
    var result = sets[0] || new Set();
    for (let s of sets.slice(1)) {
      result = new Set([...result].filter((x) => s.has(x)));
    }
    return result;
  };
  const unionAll = (sets) => {
    let result = new Set();
    for (let s of sets) {
      for (let x of s) {
        result.add(x);
      }
    }
    return result;
  };

  const record_ids_matching_query = (query) => {
    //alert(JSON.stringify(query,null,2))
    return intersectAll(
      facetIds
        .map((facetId) => {
          //queries may specify multiple values per facet...
          //...a record tagged with ANY of these terms should be consider a match.  (OR logic)
          return unionAll(
            (query[facetId] || []).map((term) => ix[facetId][term])
          );
        })
        .filter((s) => s.size > 0)
    );
  };

  const search = (query) => {
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
          in_query: facet_id in query && query[facet_id].indexOf(term) > -1,
          count: intersectAll(
            [
              matching_ids_independent_of_facet[facet_id],
              ids_matching_term
            ].filter((s) => s.size > 0)
          ).size
        }))
        .filter((term) => term.count > 0 || term.in_query);
      return { facet_id, term_buckets };
    });

    let term_buckets_by_facet_id = Object.fromEntries((facets || []).map(f => [
      f.facet_id,
      Object.fromEntries(f.term_buckets.map(tb => [tb.term, tb]))
    ]));

    return {
      query: { ...query },
      facets: facets || [],
      term_buckets_by_facet_id,
      facetTermCount: (facet,term) => 
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
    display_fields: 
    candidate_facet_fields,
    data: ix
  };
};

export {GetDefaultSearchResult, FacetedIndex};