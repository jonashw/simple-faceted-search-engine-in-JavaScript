import React  from "react";

type FieldsToggleParams = {
	label: string,
	description: string,
	fieldNames: string[],
	fieldValues?: {[fn: string]: Set<string|number>},
	selectedFieldNames: Set<string>,
	setSelectedFieldNames: (fns: Set<string>) => void
}

const FieldsToggle = ({
	label,
	description,
	fieldNames,
	selectedFieldNames,
	setSelectedFieldNames,
	fieldValues
}: FieldsToggleParams) => (
	<div>
		<label className="form-label h5">
			{label}
		</label>
		<p>
			{description}
		</p>
		{fieldNames.map(f =>
			<label className="form-check" key={f}>
				<input
					className="form-check-input"
					type="checkbox"
					checked={selectedFieldNames.has(f)}
					onChange={() => {
						let newFNs = new Set<string>(selectedFieldNames);
						if (selectedFieldNames.has(f)) {
							newFNs.delete(f);
						} else {
							newFNs.add(f);
						}
						setSelectedFieldNames(newFNs);
					}}
				/>
				<span className="form-check-label">
					{f}
					{!!fieldValues && (f in fieldValues) && 
						<span
							className="text-muted"
							title={Array.from(fieldValues[f]).sort().join('\n')}>
								{' ' }({fieldValues[f].size} unique values)
						</span>
					}
				</span>
			</label>)}
	</div>
);

export default FieldsToggle;