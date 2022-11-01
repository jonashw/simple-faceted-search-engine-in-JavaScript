import React from "react";
import SearchBox from './SearchBox';
import { GetDefaultSearchResult, FacetedIndexInstance, UISettingControl, UISettings, Query } from "../model";
import Pagination from "./Pagination";
import KeywordInput from "./KeywordInput";
import SearchFilters from "./SearchFilters";
import ActiveFilters from "./ActiveFilters";

const Search = ({ 
  ix,
  debug,
  uiSettingControls,
  uiSettings,
  setUiSettings,
  query,
  setQuery
} : {
  ix: FacetedIndexInstance;
  debug: boolean;
  uiSettingControls: UISettingControl<number|string>[];
  uiSettings: UISettings,
  setUiSettings: (settings: UISettings) => void,
  query: Query,
  setQuery: (q: Query) => void
}) => {
  const [searchResult, setSearchResult] = React.useState(GetDefaultSearchResult());
  const [currentPageNumber,setCurrentPageNumber] = React.useState(1);

  const pagination = 
    searchResult.records.length < parseInt(uiSettings.pageSize)
    ? <></>
    : <Pagination
      recordCount={searchResult.records.length} 
      {...{
        pageSize: uiSettings.pageSize,
        currentPageNumber,
        setCurrentPageNumber
      }} />;

  const toggleQueryTerm = (facet_id: string, term: string) => {
    let newQuery = ix.toggleQueryTerm(query, facet_id, term);
    setQuery(newQuery);
  };

  return (
    <div className="row">
      <div className={"col-" + uiSettings.horizontalSplit.split('/')[0]}>
        {/*
        
        <KeywordInput {...{ix,query,setQuery}} />
        */}
        <SearchFilters 
          {...{
            ix,
            debug,
            query,
            setQuery,
            searchResult,
            setSearchResult
          }}
        />
      </div>
      <div className={"col-" + uiSettings.horizontalSplit.split('/')[1]}>
        {/* 
        <SearchBox
          terms={ix.terms}
          searchResult={searchResult}
          toggleQueryTerm={toggleQueryTerm}
        />
        */}
        <ActiveFilters 
          query={query}
          clearQuery={() => { setQuery({}) }}
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
          {ix.getResultsPage(searchResult.records, currentPageNumber, parseInt(uiSettings.pageSize)).map((r, i) => (
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