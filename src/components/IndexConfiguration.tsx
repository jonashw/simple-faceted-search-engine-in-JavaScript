import React from "react";
import {FacetTermParents, RecordsMetadata, SelectedFieldNames } from '../model';
import FieldsToggle from "./FieldsToggle";
import FloatingActionButton from "./FloatingActionButton";
import isTouchDevice from "./isTouchDevice";

export default ({
	metadata,
	onSuccess,
	selectedFieldNames,
	setSelectedFieldNames,
	facetTermParents,
	setFacetTermParents
}: {
	metadata: RecordsMetadata,
	onSuccess: () => void,
	selectedFieldNames: SelectedFieldNames,
	setSelectedFieldNames: (sfns: SelectedFieldNames) => void,
	facetTermParents: FacetTermParents,
	setFacetTermParents: (ftp: FacetTermParents) => void
}) => {
	//const [parentTerm]

	let canBeginFacetedSearch =
		//gotta have fields to search at all!
		selectedFieldNames.facet.size > 0 && selectedFieldNames.display.size > 0;

	return <div>
		<div>
			<div className="row mt-3">
				<div className="col-md-6 mb-4">
					<FieldsToggle 
						label="Facet Fields"
						description="Select the fields that should be used as facets"
						fieldNames={metadata.fieldNames}
						fieldValues={metadata.valuesByFieldName}
						selectedFieldNames={selectedFieldNames.facet}
						setSelectedFieldNames={(fns: Set<string>) => setSelectedFieldNames({...selectedFieldNames, facet: fns} )}
					/>
				</div>
				<div className="col-md-6 mb-4">
					<FieldsToggle 
						label="Display Fields"
						description="Select the fields that should be displayed in search results"
						fieldNames={metadata.fieldNames}
						selectedFieldNames={selectedFieldNames.display}
						setSelectedFieldNames={(fns: Set<string>) => setSelectedFieldNames({...selectedFieldNames, display: fns} )}
					/>
				</div>
			</div>
			<h5>Optional: facet hiererchy</h5>
			<div className="row">
				{Array.from(selectedFieldNames.facet).map(fn => ({
					facetName: fn,
					terms: Array.from(metadata.valuesByFieldName[fn]) 
				}))
				.map(({facetName,terms}) =>
					<div className="col-6">
						<h6>{facetName}</h6>
						{terms.map(t => <div className="row mb-3">
							<div className="col-sm-5">
								{t}
							</div>
							<div className="col-sm-7">
								<select
									className="form-select form-select-sm"
									value={(facetTermParents[facetName] || {})[t]}
									onChange={e => {
										e.preventDefault();
										let updatedFacetTermParents = {
											...facetTermParents,
											[facetName]: {
												...(facetTermParents[facetName] || {}),
												[t]: e.target.value
											}
										};
										if(!e.target.value){
											delete updatedFacetTermParents[facetName][t];
										}
										setFacetTermParents(updatedFacetTermParents);
									}}
								>
									<option value=''></option>
									{terms.filter(tt => tt !== t).map(tt => 
										<option value={tt}>
												{tt}
										</option>)}
								</select>
							</div>
							</div>)}
					</div>
				)}
			</div>
			<pre>
				{JSON.stringify(facetTermParents,null,2)}
			</pre>
		</div>

		{isTouchDevice() 
		?
			<FloatingActionButton
				className="btn btn-success"
				disabled={!canBeginFacetedSearch}
				onClick={onSuccess}
			>
				<img src="/search-white.svg" style={{width:'1.5em'}}/>
			</FloatingActionButton>
		:
			<div className="d-grid mt-3">
				<button
					className="btn btn-success btn-lg"
					disabled={!canBeginFacetedSearch}
					onClick={onSuccess}
				>
					Begin Faceted Search
				</button>
			</div>
		}
	</div>;
}