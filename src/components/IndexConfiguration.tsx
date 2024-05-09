import {RecordsMetadata, SelectedFieldNames } from '../model';
import FieldsToggle from "./FieldsToggle";

export default ({
	metadata,
	onSuccess,
	selectedFieldNames,
	setSelectedFieldNames
}: {
	metadata: RecordsMetadata,
	onSuccess: () => void,
	selectedFieldNames: SelectedFieldNames,
	setSelectedFieldNames: (sfns: SelectedFieldNames) => void
}) => {

	let canBeginFacetedSearch =
		//gotta have fields to search at all!
		selectedFieldNames.facet.size > 0 && selectedFieldNames.display.size > 0;

	return <div>
		<div>
			<div className="row mt-3">
				<div className="col">
					<FieldsToggle 
						label="Facet Fields"
						description="Select the fields that should be used as facets"
						fieldNames={metadata.fieldNames}
						fieldValues={metadata.valuesByFieldName}
						selectedFieldNames={selectedFieldNames.facet}
						setSelectedFieldNames={(fns: Set<string>) => setSelectedFieldNames({...selectedFieldNames, facet: fns} )}
					/>
				</div>
				<div className="col">
					<FieldsToggle 
						label="Display Fields"
						description="Select the fields that should be displayed in search results"
						fieldNames={metadata.fieldNames}
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