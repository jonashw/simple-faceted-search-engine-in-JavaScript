import React from "react";
import Select from 'react-select';
import { FacetedIndexInstance, HierarchicalTermBucket, Query, SearchResult, TermBucket } from "../model";

const SearchFilters = (
  {
    ix,
    query,
    setQuery,
    debug,
    searchResult
  } : {
    ix: FacetedIndexInstance,
    query: Query,
    setQuery: (fn: (q: Query) => Query) => void,
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
    setQuery((query: Query) => {
      let newQuery = { ...query, [facet_id]: terms }
      if (newQuery[facet_id].length === 0) {
        delete newQuery[facet_id];
      }
      return newQuery;
    });

  const TermBucketSelectMenu = ({
    facet_id,
    term_buckets,
    term_is_selected
  } : {
    facet_id: string,
    term_buckets: TermBucket[],
    term_is_selected: (t: string) => boolean
  }) => {
    let options = term_buckets.map(t => ({
      value: t.term,
      in_query: t.in_query,
      label: `${t.term} (${t.count})`
    }));
    let selectedOptions = options.filter(o => o.in_query);
    return <Select 
      onChange={newSelectedOptions => setFacetQueryTerms(facet_id, newSelectedOptions.map(v => v.value) ) }
      getOptionValue={o => o.value}
      isOptionSelected={o => term_is_selected(o.value) }
      hideSelectedOptions={true}
      value={selectedOptions}
      options={options}
      isMulti={true} />;
  };

  const TermBucketLinks = ({
    facet_id,
    term_buckets,
    term_is_selected,
    level
  } : {
    facet_id: string,
    term_buckets: HierarchicalTermBucket[],
    term_is_selected: (t: string) => boolean,
    level: number
  }) =>
    <div>
      {term_buckets.map((t,i) => {
        let selected = term_is_selected(t.term);
        return (
          <div key={i}>
            <a key={t.term}
              href=""
              className="link-primary pb-1"
              style={{ textDecoration: 'none', fontWeight: selected ? '700' : 'normal', display:'block'}}
              onClick={(e) => {
                e.preventDefault();
                setQuery(query => ix.toggleQueryTerm(query, facet_id, t.term));
              }}
            >
              {t.term}
              <span className={"badge rounded-pill float-end " + (selected ? "bg-success" : "bg-light text-dark")}>
                {t.count}
              </span>
            </a>
            {('children' in t) && t.children.length > 0 && 
              <div style={{paddingLeft: `${level*10}px`}}>
                <TermBucketLinks {...{facet_id, term_buckets: t.children, term_is_selected, level: level + 1}} />
              </div>}
          </div>
        );
      })}
    </div>;
  /*
  const TermBucketCheckBoxes = ({facet_id, term_buckets, term_is_selected}) =>
    term_buckets.map((t) => {
      let selected = term_is_selected(t.term);
      return (
        <label className="form-check" key={t.term}>
          <input
            className="form-check-input"
            type="checkbox"
            checked={selected}
            onChange={() => {
              let newQuery = ix.toggleQueryTerm(query, facet_id, t.term);
              setQuery(newQuery);
            }}
          />
          <span className="form-check-label">
            {t.term}
          </span>
          <span className={"badge rounded-pill float-end " + (selected ? "bg-success" : "bg-light text-dark")}>
            {t.count}
          </span>
        </label>
      );
    });
  */
      
  return (<>
    {(searchResult.facetHierarchies || [])
      .filter((f) => f.term_buckets.length > 0)
      .map(({ facet_id, term_buckets }) => {
        return (
        <div className="mb-3" key={facet_id}>
          <div className="mb-1"><strong>{facet_id}</strong></div>
          { term_buckets.length > 10  
            ? <TermBucketSelectMenu {...{facet_id, term_buckets, term_is_selected}} />
            : <TermBucketLinks {...{facet_id, term_buckets, term_is_selected, level: 1}} />
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