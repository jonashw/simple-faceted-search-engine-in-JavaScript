import React from "react";
import ultimatePagination from 'ultimate-pagination';
const Pagination = ({recordCount,pageSize,setPageSize,pageSizeOptions,currentPageNumber,setCurrentPageNumber}) => {
    const pageCount = Math.max(1,Math.ceil(recordCount/pageSize));
    if(pageCount === 0){
        return <></>;
    }
    const actualCurrentPageNumber = Math.min(currentPageNumber, pageCount);
    if(actualCurrentPageNumber != currentPageNumber){
        // something changed about our result set, so let's just start at the beginning.
        setCurrentPageNumber(1);
    }
    var paginationModel = ultimatePagination.getPaginationModel({
        // Required
        currentPage: actualCurrentPageNumber,
        totalPages: pageCount,

        // Optional
        boundaryPagesRange: 1,
        siblingPagesRange: 1,
        hideEllipsis: false,
        hidePreviousAndNextPageLinks: false,
        hideFirstAndLastPageLinks: false
    });
    //console.log('pagination',paginationModel);
    return <div className="d-flex justify-content-between mb-3">
        <nav aria-label="Results pages">
            <ul class="pagination mb-0">
                {paginationModel.map((p, i) => {
                    const onClick = () => setCurrentPageNumber(p.value);
                    switch (p.type) {
                        //case 'PREVIOUS_PAGE_LINK': return <Pagination.Prev {...props}/>
                        //case 'NEXT_PAGE_LINK'    : return <Pagination.Next {...props}/>
                        case 'PAGE':
                            return <li className={"page-item " + (p.isActive ? "active" : "")} key={i}>
                                <a class="page-link" href="javascript:void(0)" onClick={onClick}>{p.value}</a>
                            </li>;
                        case 'ELLIPSIS':
                            return <li className={"page-item " + (p.isActive ? "active" : "")} key={i}>
                                <a class="page-link" href="javascript:void(0)" onClick={onClick}>...</a>
                            </li>;
                        default: return undefined;
                    }
                }).filter(f => !!f)}
            </ul>
        </nav>
        <div className="d-flex">
            <span className="flex-shrink-0 align-self-center me-3">
            Results per page:
            </span>
            <select onChange={e => setPageSize(e.target.value)} className="form-select">
                {pageSizeOptions.map(ps => <option value={ps} selected={ps === pageSize}>{ps}</option>)}
            </select>
        </div>
    </div>;
};

export default Pagination;