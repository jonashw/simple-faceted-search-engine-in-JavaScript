import { FacetedIndexInstance } from "./index";
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
interface WithIndex {
	type: 'withIndex'
	index: FacetedIndexInstance,
	pageSize: number;
	pageNum: number;
	query: {[facetName: string]: string[]};
	uiSettings: UISettings;
	previousState: WithRawData;
}
type AppState = Blank | WithRawData | WithIndex;

export {Blank, WithRawData, WithIndex, AppState};