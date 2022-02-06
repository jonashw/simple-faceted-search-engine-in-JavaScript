import React from "react";
import Select from 'react-select';

const SearchFilters = ({ix,query,setQuery,debug,searchResult,setSearchResult}) => {
  React.useEffect(() => {
    let r = ix.search(query);
    setSearchResult(r);
    console.log('searching',query,r);
  }, [query])

  const toggleSearchTerm = (facetKey, term) => {
    let existingFacetTerms = query[facetKey] || [];
    let newFacetTerms =
      existingFacetTerms.indexOf(term) > -1
        ? existingFacetTerms.filter((t) => t !== term)
        : [...existingFacetTerms, term];
    let newQuery = { ...query, [facetKey]: newFacetTerms };
    if (newQuery[facetKey].length === 0) {
      delete newQuery[facetKey];
    }
    setQuery(newQuery);
  };

  const setFacetQueryTerms = (facet_id, terms) => {
    let newQuery = { ...query, [facet_id]: terms }
    if (newQuery[facet_id].length === 0) {
      delete newQuery[facet_id];
    }
    setQuery(newQuery);
  };

  const TermBucketSelectMenu = ({facet_id, term_buckets}) => {
    let options = term_buckets.map(t => ({
        value: t.term,
        in_query: t.in_query,
        label: `${t.term} (${t.count})`
      }));
    let selectedOptions = options.filter(o => o.in_query);
    return <Select 
      onChange={selectedOptions => setFacetQueryTerms(facet_id, selectedOptions.map(v => v.value) ) }
      getOptionValue={o => o.value}
      hideSelectedOptions={true}
      value={selectedOptions}
      options={options}
      isMulti={true} />;
  };

  const TermBucketCheckBoxes = ({facet_id, term_buckets}) =>
    term_buckets.map((t) => (
      <label className="form-check" key={t.term}>
        <input
          className="form-check-input"
          type="checkbox"
          checked={t.in_query}
          onChange={() => toggleSearchTerm(facet_id, t.term)}
        />
        <span className="form-check-label">
          {t.term} ({t.count})
        </span>
      </label>
    ));

  return (<>
    {searchResult.facets
      .filter((f) => f.term_buckets.length > 0)
      .map(({ facet_id, term_buckets }) => {
        return (
        <div className="mb-3" key={facet_id}>
          <h4>{facet_id}</h4>
          { term_buckets.length > 10  
            ? <TermBucketSelectMenu {...{facet_id, term_buckets}} />
            : <TermBucketCheckBoxes {...{facet_id, term_buckets}} />
          }
        </div>
      );
    })}
    {!!debug &&
      <pre>{JSON.stringify(searchResult.query, null, 2)}</pre>
    }
  </>);
};

export default SearchFilters;