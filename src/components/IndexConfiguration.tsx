import React  from "react";
import {SelectedFieldNames, WithRecords} from '../model';
import FieldsToggle from "./FieldsToggle";

export default ({
	state,
	setState,
	onSuccess
}: {
	state: WithRecords,
	setState: (newState: WithRecords) => void,
	onSuccess: () => void
}) => {
	let md = state.metadata;

  const [selectedFieldNames, setSelectedFieldNames] = [
		state.selectedFieldNames,
		(sfns: SelectedFieldNames) => setState(({...state, selectedFieldNames: sfns}))
	];

	let canBeginFacetedSearch =
		//gotta have fields to search at all!
		state.selectedFieldNames.facet.size > 0 && state.selectedFieldNames.display.size > 0;

	return <div>
		<div>
			<div className="row mt-3">
				<div className="col">
					<FieldsToggle 
						label="Facet Fields"
						description="Select the fields that should be used as facets"
						fieldNames={md.fieldNames}
						fieldValues={md.valuesByFieldName}
						selectedFieldNames={selectedFieldNames.facet}
						setSelectedFieldNames={(fns: Set<string>) => setSelectedFieldNames({...selectedFieldNames, facet: fns} )}
					/>
				</div>
				<div className="col">
					<FieldsToggle 
						label="Display Fields"
						description="Select the fields that should be displayed in search results"
						fieldNames={md.fieldNames}
						selectedFieldNames={selectedFieldNames.display}
						setSelectedFieldNames={(fns: Set<string>) => setSelectedFieldNames({...selectedFieldNames, display: fns} )}
					/>
				</div>
			</div>
		</div>
		<div className="d-grid mt-3">
			<button
				className="btn btn-success btn-lg"
				disabled={!canBeginFacetedSearch}
				onClick={onSuccess}
			>
				Begin Faceted Search
			</button>
		</div>
	</div>;
}