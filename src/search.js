import React from "react";
import { useSearchParams } from "react-router-dom";
import Select from 'react-select'

const Search = ({ ix,debug }) => {
  let [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = React.useState({});

  const searchResult = ix.search(query);
  const searchPerformed = Object.keys(searchResult.query).length > 0;

  React.useEffect(() => {
    const urlQuery = Array.from(searchParams.entries())
      .filter(([key, value]) => key.indexOf("q_") === 0)
      .map(([key, value]) => [key.replace("q_", ""), value])
      .reduce((dict, [key, value]) => {
        (dict[key] = dict[key] || []).push(value);
        return dict;
      }, {});
      setQuery(urlQuery);
  }, [searchParams]);

  const setQueryFromUI = (query) => {
    let existingPairs = Array.from(searchParams.entries()).filter(
      ([key, value]) => key.indexOf("q_") === -1
    );
    let pairs = Object.entries(query).flatMap(([key, values]) =>
      values.map((v) => ["q_" + key, v])
    );

    setSearchParams(new URLSearchParams(existingPairs.concat(pairs)));
  };

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
    setQueryFromUI(newQuery);
  };

  const setFacetQueryTerms = (facet_id, terms) => {
    let newQuery = { ...query, [facet_id]: terms }
    if (newQuery[facet_id].length === 0) {
      delete newQuery[facet_id];
    }
    setQueryFromUI(newQuery);
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

  return (
    <div className="row">
      <div className="col-3">
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
      </div>
      <div className="col-9">
        {searchPerformed && (
          <button
            className="btn float-end btn-link btn-sm"
            onClick={() => setQuery({})}
          >
            Reset
          </button>
        )}
        <h5>Results: {searchResult.records.length}</h5>
        {searchResult.records.map((r, i) => (
          <div className="card mb-3" key={i}>
            <div className="card-body">
              <div className="card-text">
                <pre className="mb-0">{JSON.stringify(r, null, 2)}</pre>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Search;
