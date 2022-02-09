import {FacetedIndex,GetDefaultSearchResult} from "./FacetedIndex";
import React from "react";
import records from "./Records";
import {
    SearchFilters,
    ActiveFilters,
    RecordTermTable,
    KeywordInput,
    Pagination
} from "./ui";


const SimpleDemo = ({}) => {
    let ix = FacetedIndex(records, {
        facet_fields:   ["days","color","length","priority"],
        display_fields: []
    });
    const [query, setQuery] = React.useState({"days":["Monday"]});
    const [searchResult, setSearchResult] = React.useState(GetDefaultSearchResult());
    const pageSizeOptions = [10,20,50,100];
    const [pageSize,setPageSize] = React.useState(pageSizeOptions[0]);
    const [currentPageNumber,setCurrentPageNumber] = React.useState(1);
    const debug = true;

    React.useEffect(() => {
        if(debug){
            console.log('query changed:', Object.fromEntries(Object.entries(query).map(([k,v]) => [k, v.join(", ")])), query);
            console.log(ix);
        }
    }, [query]);

    return (
        <div className="container-fluid py-3">
        <div className="row">
            <div className="col-2">
                <KeywordInput {...{ix,query,setQuery}} />
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
            <div className="col-10">
                <ActiveFilters query={query} setQuery={setQuery} ix={ix}/>

                <h5 className="mt-3">Results: {searchResult.records.length}</h5>
                <div className="row row-cols-2">
                    {ix.getResultsPage(searchResult.records, currentPageNumber, pageSize).map((r, i) => (
                        <div className="col" key={i}>
                            <RecordTermTable 
                                thWidth="200px"
                                className="mb-3"
                                record={r}
                                facetIds={ix.actual_facet_fields}
                                facetTermCount={searchResult.facetTermCount}
                                onClick={(facetId,term) => {
                                    let nextQuery = ix.toggleQueryTerm(query, facetId, term);
                                    setQuery(nextQuery);
                                }}
                            />
                        </div>
                    ))}
                </div>
                <Pagination recordCount={searchResult.records.length} {...{pageSize, setPageSize, pageSizeOptions, currentPageNumber, setCurrentPageNumber}} />
            </div>
        </div>
        </div>
    );
};

export default SimpleDemo;