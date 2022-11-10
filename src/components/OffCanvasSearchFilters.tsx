import React from "react";
import { FacetHierarchicalTermBucket, Query, QuerySetter, RecordCounts } from "../model";
import QueryUtil from "../model/QueryUtil";
import TermBucketLinks from "./TermBucketLinks";
import ActiveFilters from './ActiveFilters';

const OffCanvasSearchFilters = ({
	facetHierarchies,
	query,
	setQuery,
	open,
	setOpen,
	term_is_selected,
	recordCounts
} : {
	facetHierarchies: FacetHierarchicalTermBucket[],
	query: Query,
	setQuery: QuerySetter,
	open: boolean,
	setOpen: (o: boolean) => void,
	term_is_selected: (f:string,t:string) => boolean,
	recordCounts: RecordCounts
}) => {
	const [openFacet,setOpenFacet] = React.useState<string|undefined>();
	const toggleFacetTerm = (facet_id: string, term: string) =>
		setQuery(query => QueryUtil.toggleFacetTerm(query, facet_id, term));
	return (
	<div className={"offcanvas offcanvas-start" + (open ? " show" : "")}
		style={open ? {visibility: 'visible'} : {}}
		tabIndex={-1}
		aria-labelledby="filters-offcanvas"
	>
		<div className="offcanvas-header">
			<h5 className="offcanvas-title" id="filters-offcanvas">Filters</h5>
			<button type="button" className="btn-close" aria-label="Close" onClick={() => setOpen(false)}></button>
		</div>
		<div className="offcanvas-body">
			<div className="accordion accordion-flush">
				<div>
					Showing {recordCounts.filtered} of {recordCounts.total}
				</div>
				{Object.values(query).length > 0 && <div className="mb-3">
					<ActiveFilters
						toggleQueryTerm={toggleFacetTerm}
						query={query}
						clearQuery={() => setQuery(_ => ({}))
					}/>
				</div>}
				{(facetHierarchies || [])
					.filter((f) => f.term_buckets.length > 0)
					.map(({ facet_id, term_buckets }) => {
						let expanded = openFacet === facet_id;
						let facet_slug = facet_id.replace(/ /g, '');
						return (
							<div className="accordion-item" key={facet_id}>
								<h2 className="accordion-header">
									<button
										id={"accordion-header-" + facet_slug}
										className={"accordion-button" + (expanded ? "" : " collapsed")}
										type="button"
										aria-expanded={expanded}
										aria-controls={"flush-" + facet_slug}
										style={{fontWeight:'bold'}}
										onClick={_ => {
											setOpenFacet(openFacet === facet_id ? undefined : facet_id);
										}}
									>
										{facet_id}
									</button>
								</h2>
								<div
									id={"flush-" + facet_slug}
									className={"accordion-collapse " + (expanded ? "open" : "collapse")}
									aria-labelledby={"accordion-header-" + facet_slug}
								>
									<div className="accordion-body">
										<TermBucketLinks {...{ facet_id, term_buckets, term_is_selected, level: 1, toggleFacetTerm }} />
									</div>
								</div>
							</div>
						);
					})
				}
			</div>
		</div>
	</div>
	);
}

export default OffCanvasSearchFilters;