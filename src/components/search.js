import React from "react";
import SearchBox from './SearchBox';
import { useSearchParams } from "react-router-dom";

import KeywordInput from './KeywordInput'
import SearchFilters from "./SearchFilters";
import ActiveFilters from "./ActiveFilters";
import Pagination from "./Pagination";
import {GetDefaultSearchResult} from '../model';

const Search = ({ ix,debug, uiSettingControls, uiSettings, setUiSettings }) => {
  const [query, setQuery] = React.useState({});
  const [searchResult, setSearchResult] = React.useState(GetDefaultSearchResult());
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentPageNumber,setCurrentPageNumber] = React.useState(1);

  React.useEffect(() => {
    const urlQuery = Array.from(searchParams.entries())
      .filter(([key, value]) => key.indexOf("q_") === 0)
      .map(([key, value]) => [key.replace("q_", ""), value])
      .reduce((dict, [key, value]) => {
        (dict[key] = dict[key] || []).push(value);
        return dict;
      }, {});
    console.log('setting query from url',urlQuery);
    setQuery(urlQuery);
  }, [ix,searchParams]);

  const setQueryFromUI = (query) => {
    let existingPairs = Array.from(searchParams.entries()).filter(
      ([key, value]) => key.indexOf("q_") === -1
    );
    let pairs = Object.entries(query).flatMap(([key, values]) =>
      values.map((v) => ["q_" + key, v])
    );

    setSearchParams(new URLSearchParams(existingPairs.concat(pairs)));
  };

  const pagination = 
    searchResult.records.length < uiSettings.pageSize
    ? <></>
    : <Pagination
      recordCount={searchResult.records.length} 
      {...{
        pageSize: uiSettings.pageSize,
        currentPageNumber,
        setCurrentPageNumber
      }} />;

  const toggleQueryTerm = (facet_id, term) => {
    let newQuery = ix.toggleQueryTerm(query, facet_id, term);
    setQueryFromUI(newQuery);
  };

  return (
    <div className="row">
      <div className={"col-" + uiSettings.horizontalSplit.split('/')[0]}>
        <KeywordInput {...{ix,query,setQuery}} />
        <SearchFilters 
          {...{
            ix,
            debug,
            query,
            setQuery: setQueryFromUI,
            searchResult,
            setSearchResult
          }}
        />
      </div>
      <div className={"col-" + uiSettings.horizontalSplit.split('/')[1]}>
        <SearchBox
          terms={ix.terms}
          searchResult={searchResult}
          toggleQueryTerm={toggleQueryTerm}
        />
        <ActiveFilters 
          query={query}
          clearQuery={() => setQueryFromUI({})}
          toggleQueryTerm={toggleQueryTerm} 
        />
        <div className="d-flex justify-content-start">
          {uiSettingControls.map(control => 
            <div key={control.label} className="mb-3 me-3">
              <label className="mb-1">{control.label}</label>
              <select
                className="form-select"
                value={uiSettings[control.key]}
                onChange={e => setUiSettings({...uiSettings, [control.key]: e.target.value}) }
              >
                {control.options.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>)}
        </div>
        <h5 className="mt-3">Results: {searchResult.records.length}</h5>
        {pagination}
        <div className={"row row-cols-" + uiSettings.recordsPerRow}>
          {ix.getResultsPage(searchResult.records, currentPageNumber, uiSettings.pageSize).map((r, i) => (
            <div className="col" key={i}>
              <div className="card mb-3">
                <div className="card-body">
                  <div className="card-text">
                    <pre className="mb-0">{JSON.stringify(r, null, 2)}</pre>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        {pagination}
      </div>
    </div>
  );
};

export default Search;
