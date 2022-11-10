import {
  FacetedIndexConfig,
  FacetedIndexInstance,
  RecordWithMetadata,
  SearchResult ,
  RecordValue,
  Query,
  TextIndex,
  Taxonomy,
  FacetTermRecordIndex
} from './types';

import search from './search';

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

  var facetTermRecordIndex: FacetTermRecordIndex = {};
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
    facetTermRecordIndex[facetId][parentTerm] = facetTermRecordIndex[facetId][parentTerm] || new Set<number>();
    facetTermRecordIndex[facetId][parentTerm].add(recordId);
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
      facetTermRecordIndex[fieldName] = facetTermRecordIndex[fieldName] || {};
      let terms = 
        Array.isArray(record[fieldName])
        ? record[fieldName]
        : [record[fieldName]];
      record_tags[record_id][fieldName] = terms;
      for (let term of terms) {
        facetTermRecordIndex[fieldName][term] = facetTermRecordIndex[fieldName][term] || new Set();
        facetTermRecordIndex[fieldName][term].add(record_id);
        termsDict[term] = term;
        traverseFacetUpwards(fieldName, term, record_id);
      }
    }
    all_record_ids.push(record_id);
    record_id++;
  }

  const terms = Object.keys(termsDict);
  const facetIds = Object.keys(facetTermRecordIndex).filter(allowableFacetId);
  let taxonomy: Taxonomy = [];

  const process = (() => {
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

  const text_index: TextIndex = records_with_metadata.map(r => ({
    text: r.searchable_text.join(' '),
    record_id: r.id
  }));

  return {
    search: (query: Query, searchKeyWord: string | undefined) =>
      search(
        facetIds,
        all_record_ids,
        records_with_metadata,
        facetTermRecordIndex,
        config.facet_term_parents,
        text_index,
        query,
        searchKeyWord),
    text_index,
    actual_facet_fields: facetIds,
    display_fields: candidate_facet_fields,
    candidate_facet_fields,
    data: facetTermRecordIndex,
    terms,
    taxonomy
  };
};

export {GetDefaultSearchResult, CreateFacetedIndex };