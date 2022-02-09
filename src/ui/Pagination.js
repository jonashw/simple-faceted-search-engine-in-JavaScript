import React from "react";
import ultimatePagination from 'ultimate-pagination';
const Pagination = ({recordCount,pageSize,currentPageNumber,setCurrentPageNumber}) => {
    const pageCount = Math.max(1,Math.ceil(recordCount/pageSize));
    const currentPage = pageCount > 0 ? currentPageNumber : 1;
    var paginationModel = ultimatePagination.getPaginationModel({
        // Required
        currentPage,
        totalPages: pageCount,

        // Optional
        boundaryPagesRange: 1,
        siblingPagesRange: 1,
        hideEllipsis: false,
        hidePreviousAndNextPageLinks: false,
        hideFirstAndLastPageLinks: false
    });
    //console.log('pagination',paginationModel);
    if(pageCount === 0){
        return <></>;
    }
    return <nav aria-label="Results pages">
        <ul class="pagination">
            {paginationModel.map((p,i) => {
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
            }) .filter(f => !!f)}
        </ul>
    </nav>;
};

export default Pagination;