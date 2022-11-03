import React from "react";
import ultimatePagination from 'ultimate-pagination';
const Pagination = ({
    recordCount,
    pageSize,
    currentPageNumber,
    setCurrentPageNumber
} : {
    recordCount: number,
    pageSize: number,
    currentPageNumber: number,
    setCurrentPageNumber: (pn: number) => void
}) => {
    const pageCount = Math.max(1,Math.ceil(recordCount/pageSize));
    const actualCurrentPageNumber = Math.min(currentPageNumber, pageCount);
    if(actualCurrentPageNumber != currentPageNumber){
        setCurrentPageNumber(1);
    }
    React.useEffect(() => {
        console.log({currentPageNumber,actualCurrentPageNumber});
        if(currentPageNumber !== actualCurrentPageNumber){
            /* something changed about our result set, so let's just start at the beginning.
            ** if we don't, the user will be stranded on a page that doesn't exist with no
            ** means to navigate back to safety. */
            setCurrentPageNumber(actualCurrentPageNumber);
        }
    }, []);
    if(pageCount === 0){
        return <div/>;
    }
    if(pageCount === 1){
        return <nav aria-label="Results pages">
            <ul className="pagination mb-0">
                <li className="page-item disabled">
                    <a className="page-link" aria-disabled={true}>Page 1 of 1</a>
                </li>
            </ul>
        </nav>;
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
    return <div className="d-flex justify-content-between">
        <nav aria-label="Results pages">
            <ul className="pagination mb-0">
                {paginationModel.map((p, i) => {
                    switch (p.type) {
                        //case 'PREVIOUS_PAGE_LINK': return <Pagination.Prev {...props}/>
                        //case 'NEXT_PAGE_LINK'    : return <Pagination.Next {...props}/>
                        case 'PAGE':
                            return <li className={"page-item " + (p.isActive ? "active" : "")} key={i}>
                                <a  className="page-link" 
                                    href="" 
                                    onClick={e => {
                                        e.preventDefault();
                                        setCurrentPageNumber(p.value);
                                    }}
                                >{p.value}</a>
                            </li>;
                        case 'ELLIPSIS':
                            return <li className={"page-item " + (p.isActive ? "active" : "")} key={i}>
                                <a  className="page-link"
                                    href="" 
                                    onClick={e => {
                                        e.preventDefault();
                                        setCurrentPageNumber(p.value);
                                    }}
                                >...</a>
                            </li>;
                        default: return undefined;
                    }
                }).filter(f => !!f)}
            </ul>
        </nav>
    </div>;
};

export default Pagination;