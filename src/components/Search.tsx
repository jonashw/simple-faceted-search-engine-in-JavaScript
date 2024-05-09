import React from "react";
import SearchBox from './SearchBox';
import { GetDefaultSearchResult, FacetedIndexInstance, UISettingControl, UISettings, Query } from "../model";
import Pagination from "./Pagination";
import SearchFilters from "./SearchFilters";
import ActiveFilters from "./ActiveFilters";
import RecordTermTable from "./RecordTermTable";

const Search = ({ 
  ix,
  debug,
  uiSettingControls,
  uiSettings,
  setUiSettings,
  query,
  setQuery,
  viewSettings,
  currentPageNumber,
  setCurrentPageNumber
} : {
  ix: FacetedIndexInstance;
  debug: boolean;
  uiSettingControls: UISettingControl<number|string>[];
  uiSettings: UISettings;
  setUiSettings: (settings: UISettings) => void;
  query: Query;
  setQuery: (q: Query) => void;
  viewSettings: () => void;
  currentPageNumber: number,
  setCurrentPageNumber: (p: number) => void
}) => {
  const [searchResult, setSearchResult] = React.useState(GetDefaultSearchResult());
  const [showTermTables/*, setShowTermTables*/] = React.useState(false);

  const pagination = 
    <div className="mb-3">
     <Pagination
      recordCount={searchResult.records.length} 
      {...{
        pageSize: parseInt(uiSettings.pageSize),
        currentPageNumber,
        setCurrentPageNumber
      }} />
    </div>;

  const toggleQueryTerm = (facet_id: string, term: string) => {
    let newQuery = ix.toggleQueryTerm(query, facet_id, term);
    setQuery(newQuery);
  };

  const uiOptions = 
    <div className="d-flex justify-content-between align-items-end">
      {pagination}
      <div className="d-flex justify-content-end">
        {uiSettingControls.map(control => 
          <div key={control.label} className="mb-3 ms-3">
            <label className="mb-1">{control.label}</label>
            <select
              className="form-select form-select-sm"
              value={uiSettings[control.key]}
              onChange={e => setUiSettings({...uiSettings, [control.key]: e.target.value}) }
            >
              {control.options.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>)}
      </div>
    </div>;

  return (
    <div className="row">
      <div className={"col-" + uiSettings.horizontalSplit.split('/')[0]}>
        <SearchBox
          searchResult={searchResult}
          toggleQueryTerm={toggleQueryTerm}
        />
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
        <div className="d-flex justify-content-between align-items-start">
          <ActiveFilters 
            query={query}
            clearQuery={() => { setQuery({}) }}
            toggleQueryTerm={toggleQueryTerm} 
          />

          <button className="btn btn-outline-secondary" onClick={() => viewSettings()}>
            ⚙️
          </button>
        </div>
        
        <h5 className="mt-3">Results: {searchResult.records.length}</h5>
        {uiOptions}
        <div className={"row row-cols-" + uiSettings.recordsPerRow}>
          {ix.getResultsPage(searchResult.records, currentPageNumber, parseInt(uiSettings.pageSize)).map((r, i) => (
            <div className="col" key={i}>
              <div className="card mb-3">
                <div className="card-body">
                  <div className="card-text">
                    <pre className="mb-0">{JSON.stringify(r, null, 2)}</pre>
                    {showTermTables && <RecordTermTable
                      record={r}
                      facetIds={searchResult.facets.map(f => f.facet_id)}
                      onClick={toggleQueryTerm}
                      facetTermCount={searchResult.facetTermCount}
                      thWidth={undefined}
                      className={"mb-0"}
                    />}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        {uiOptions}
      </div>
    </div>
  );
};

export default Search;