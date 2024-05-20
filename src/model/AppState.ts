import { FacetedIndexInstance, Record } from "./index";
import { BaseRecord, RecordsMetadata, SelectedFieldNames } from "./types";
import { UISettings } from "./UISettings";

type AppState<TRecord extends BaseRecord> = {
	dataUrl: undefined | string;
	dataState: undefined | DataState<TRecord>
};
type DataState<TRecord extends BaseRecord> = {
	rawData: any;
	recordsKey: undefined | string;
	indexConfigState: undefined | IndexConfigState<TRecord>;
};
type IndexConfigState<TRecord extends BaseRecord> = {
	records: Record[];
	metadata: RecordsMetadata;
	selectedFieldNames: SelectedFieldNames;
	searchState: undefined | SearchState<TRecord>;
};
type SearchState<TRecord extends BaseRecord> = {
	index: FacetedIndexInstance<TRecord>;
	pageSize: number;
	pageNum: number;
	query: {[facetName: string]: string[]};
	uiSettings: UISettings;
};

export type {AppState, DataState, IndexConfigState, SearchState};