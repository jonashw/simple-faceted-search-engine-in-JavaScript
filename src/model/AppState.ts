import { FacetedIndexInstance, Record } from "./index";
import { RecordsMetadata, SelectedFieldNames } from "./types";
import { UISettings } from "./UISettings";

type AppState = {
	dataUrl: undefined | string;
	dataState: undefined | DataState
};
type DataState = {
	rawData: any;
	recordsKey: undefined | string;
	indexConfigState: undefined | IndexConfigState;
};
type IndexConfigState = {
	records: Record[];
	metadata: RecordsMetadata;
	selectedFieldNames: SelectedFieldNames;
	searchState: undefined | SearchState;
};
type SearchState = {
	index: FacetedIndexInstance;
	pageSize: number;
	pageNum: number;
	query: {[facetName: string]: string[]};
	uiSettings: UISettings;
};

export {AppState, DataState, IndexConfigState, SearchState};