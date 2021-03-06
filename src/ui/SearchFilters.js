import React from "react";
import Select from 'react-select';

const SearchFilters = ({ix,query,setQuery,debug,searchResult,setSearchResult}) => {
  const [activeTerms,setActiveTerms] = React.useState(new Set());
  const term_is_selected = t => activeTerms.has(t);

  React.useEffect(() => {
    let allTerms = Object.values(query).flatMap(terms => terms);
    setActiveTerms(new Set(allTerms));
  }, [query])

  React.useEffect(() => {
    new Promise((resolve) => {
        setTimeout(() => {
            let r = ix.search(query);
            setSearchResult(r);
            resolve(r);
            //console.log('searching',query,r);
        }, 0);
    })
  }, [query])

  const setFacetQueryTerms = (facet_id, terms) => {
    let newQuery = { ...query, [facet_id]: terms }
    if (newQuery[facet_id].length === 0) {
      delete newQuery[facet_id];
    }
    setQuery(newQuery);
  };

  const TermBucketSelectMenu = ({facet_id, term_buckets, term_is_selected}) => {
    let options = term_buckets.map(t => ({
        value: t.term,
        in_query: t.in_query,
        label: `${t.term} (${t.count})`
      }));
    let selectedOptions = options.filter(o => o.in_query);
    return <Select 
      onChange={selectedOptions => setFacetQueryTerms(facet_id, selectedOptions.map(v => v.value) ) }
      getOptionValue={o => o.value}
      isOptionSelected={o => term_is_selected(o.value) }
      hideSelectedOptions={true}
      value={selectedOptions}
      options={options}
      isMulti={true} />;
  };

  const TermBucketLinks = ({facet_id, term_buckets, term_is_selected}) =>
    term_buckets.map((t) => {
      let selected = term_is_selected(t.term);
      return (
        <a key={t.term}
          href="javascript:void(0)"
          className="link-primary pb-1" 
          style={{ textDecoration: 'none', fontWeight: selected ? '700' : 'normal', display:'block'}}
          onClick={() => {
            let newQuery = ix.toggleQueryTerm(query, facet_id, t.term);
            setQuery(newQuery);
          }}
        >
          {t.term}
          <span className={"badge rounded-pill float-end " + (selected ? "bg-success" : "bg-light text-dark")}>
            {t.count}
          </span>
        </a>
      );
    });

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
      
  return (<>
    {searchResult.facets
      .filter((f) => f.term_buckets.length > 0)
      .map(({ facet_id, term_buckets }) => {
        return (
        <div className="mb-3" key={facet_id}>
          <div className="mb-1"><strong>{facet_id}</strong></div>
          { term_buckets.length > 10  
            ? <TermBucketSelectMenu {...{facet_id, term_buckets, term_is_selected}} />
            : <TermBucketLinks {...{facet_id, term_buckets, term_is_selected}} />
          }
        </div>
      );
    })}
    {!!debug &&
          <>
              <pre>{JSON.stringify(query, null, 2)}</pre>
              <pre>{JSON.stringify(Array.from(activeTerms), null, 2)}</pre>
          </>
    }
  </>);
};

export default SearchFilters;