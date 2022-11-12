import { RecordValue, SearchResult } from "../model";
import RecordTermTable from "./RecordTermTable";

const RecordRows = ({
  searchResult,
  currentPageNumber,
  pageSize,
  recordsPerRow,
  toggleQueryTerm
} : {
  searchResult: SearchResult,
  currentPageNumber: number,
  pageSize: number,
  recordsPerRow: number,
  toggleQueryTerm: (facet_id: string, term: string) => void
}) =>
  <div className={"row row-cols-" + recordsPerRow}>
    {searchResult.getPageOfRecords(currentPageNumber, pageSize).map((r, i) => (
      <div className="col" key={i}>
        <div className="card mb-3">
          <div className="card-body">
            <div className="card-text" style={{overflow:'auto'}}>
              <pre className="mb-3">{JSON.stringify(r.paired_down_record, null, 2)}</pre>
              <RecordTermTable
                record={r.tags as RecordValue}
                facetIds={searchResult.facets.map(f => f.facet_id)}
                onClick={toggleQueryTerm}
                facetTermCount={searchResult.facetTermCount}
                thWidth={undefined}
                className={"mb-0"}
              />
              {/*
                <pre className="mt-3 mb-0">
                  {JSON.stringify(r.searchable_text, null, 2)}
                </pre>
              */}
            </div>
          </div>
        </div>
      </div>
    ))}
  </div>;

export default RecordRows;