type FieldValue = string | number;
type RecordValue = { [key: string]: FieldValue };
type Field = {
	name: string;
	values: Set<FieldValue>;
}
type SelectedFieldNames = 
{
	display: Set<string>;
	facet: Set<string>;
}
type RecordsMetadata = {
	fields: Field[];
	fieldNames: string[];
	valuesByFieldName: {[fieldName:string]: Set<FieldValue>} 
	recommended_selections: {
    display: Set<string>,
    facet: Set<string>
  }
}
type RecordWithMetadata = {
  //TODO: reconcile with RecordsMetadata type
  id: number;
  tags: RecordValue;
  paired_down_record: RecordValue;
  original_record: RecordValue;
  searchable_text: string[];
}

type ChildParentRelations = {[childTerm: FieldValue]: FieldValue};

type FacetedIndexConfig = {
  display_fields: string[],
  facet_fields: string[],
  //The extra level of nesting is just-in-case 2+ facets share a term name
  facet_term_parents: {[facet_id: string]: {[term: string]: string}}
}
type Query = {[facetId: string] : string[]};

type TextIndex = {
  text: string;
  record_id: number;
}[];

type FacetedIndexInstance = {
  text_index: TextIndex,
  search: (query: Query, seachKeyWord?: string | undefined) => SearchResult,
  actual_facet_fields: string[],
  getResultsPage: (results: RecordWithMetadata[], pageNumber: number, pageSize: number) => RecordWithMetadata[],
  toggleQueryTerm: (query: Query, facetKey: string, term: string) => Query,
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
  records: RecordWithMetadata[]
}


export {
	FieldValue,
	RecordValue as RecordValue,
	Field,
	RecordsMetadata,
	ChildParentRelations,
	Query,
	FacetedIndexConfig,
	FacetedIndexInstance,
	FacetTermBucket,
	FacetHierarchicalTermBucket,
	HierarchicalTermBucket,
	TermBucket,
	SearchResult,
  SelectedFieldNames,
  RecordWithMetadata,
  TextIndex
};