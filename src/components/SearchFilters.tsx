import React from "react";
import { Query, QuerySetter, SearchResult} from "../model";
import QueryUtil from "../model/QueryUtil";
import TermBucketLinks from "./TermBucketLinks";
import TermBucketSelectMenu from "./TermBucketSelectMenu";

const SearchFilters = (
  {
    query,
    setQuery,
    debug,
    searchResult
  } : {
    query: Query,
    setQuery: QuerySetter,
    debug: boolean,
    searchResult: SearchResult
  }) => {
  const [activeTerms,setActiveTerms] = React.useState(new Set());
  const term_is_selected = (t: string) => activeTerms.has(t);

  React.useEffect(() => {
    let allTerms = Object.values(query).flatMap(terms => terms);
    setActiveTerms(new Set(allTerms));
  }, [query])

  const setFacetQueryTerms = (facet_id: string, terms: string[]): void => 
    setQuery((query: Query) => QueryUtil.setFacetTerms(query, facet_id, terms));

  const toggleFacetTerm = (facet_id: string, term: string) =>
    setQuery(query => QueryUtil.toggleFacetTerm(query, facet_id, term));
      
  return (<>
    {(searchResult.facetHierarchies || [])
      .filter((f) => f.term_buckets.length > 0)
      .map(({ facet_id, term_buckets }) => {
        return (
        <div className="mb-3" key={facet_id}>
          <div className="mb-1"><strong>{facet_id}</strong></div>
          { term_buckets.length > 10  
            ? <TermBucketSelectMenu {...{facet_id, term_buckets, term_is_selected, setFacetQueryTerms}} />
            : <TermBucketLinks {...{facet_id, term_buckets, term_is_selected, level: 1, toggleFacetTerm}} />
          }
        </div>
      );
    })}
    {!!debug &&
      <>
        <pre>{JSON.stringify(searchResult.facetHierarchies, null, 2)}</pre>
        <pre>{JSON.stringify(query, null, 2)}</pre>
        <pre>{JSON.stringify(Array.from(activeTerms), null, 2)}</pre>
      </>
    }
  </>);
};

export default SearchFilters;