import { FacetedIndexInstance, Record,RecordsMetadata, SelectedFieldNames  } from "./index";
import { UISettings } from "./UISettings";

interface Blank {
	type:'blank';
	dataUrl: string;
};
interface WithRawData {
	type: 'withRawData';
	data: any;
	recordsKey: string;
	previousState: Blank;
};
interface WithRecords {
	type: 'withRecords';
	records: Record[];
	metadata: RecordsMetadata;
	selectedFieldNames: SelectedFieldNames;
	previousState: WithRawData;
};
interface WithIndex {
	type: 'withIndex'
	index: FacetedIndexInstance,
	pageSize: number;
	pageNum: number;
	query: {[facetName: string]: string[]};
	uiSettings: UISettings;
	previousState: WithRecords;
}
type AppState = Blank | WithRawData | WithRecords | WithIndex;

export {Blank, WithRecords, WithRawData, WithIndex, AppState};