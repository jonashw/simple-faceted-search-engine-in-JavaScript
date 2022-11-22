import {
	RecordValue,
	GetRecordsMetadata,
	CreateFacetedIndex,
	defaultUiSettings,
  AppState,
  IndexConfigState,
  SearchState
} from '../model';
import AppStateDto from './AppStateDto';

const tryGetIndexConfigState = (dto: AppStateDto, data: any): IndexConfigState | undefined => {
	let recordsCandidate = !!dto.records_key ? data[dto.records_key] : data;
	if(!Array.isArray(recordsCandidate)){
		return undefined;
	}
	let records: RecordValue[] = recordsCandidate;
	let metadata = GetRecordsMetadata(records);
	return {
		metadata,
		records,
    facetTermParents: dto.facet_term_parents,
		selectedFieldNames: {
			facet  : new Set<string>(dto.  facet_fields.length === 0 ? metadata.recommended_selections.  facet : dto.facet_fields  ),
			display: new Set<string>(dto.display_fields.length === 0 ? metadata.recommended_selections.display : dto.display_fields)
		},
		searchState: tryGetSearchState(dto, records)
	};
};

const tryGetSearchState = (dto: AppStateDto, records: RecordValue[]): undefined | SearchState => {
  if(dto.facet_fields.length === 0 || dto.display_fields.length === 0){
    return undefined;
  }
  let index = CreateFacetedIndex(records, {
    facet_term_parents: {},
    fields: {
      display: new Set(dto.display_fields),
      facet:  new Set(dto.facet_fields)
    }
  });
  return {
    index,
    searchString: dto.search_string || "",
    pageNum: 1,
    pageSize: 200,
    query: dto.query,
    uiSettings: dto.ui_settings || defaultUiSettings
  }
};

export default {
  toDto: (state: AppState): AppStateDto => ({
    url: state.dataUrl,
    search_string: state.dataState?.indexConfigState?.searchState?.searchString,
    records_key: state.dataState?.recordsKey,
    facet_term_parents: state.dataState?.indexConfigState?.facetTermParents || {},
    facet_fields: Array.from(state.dataState?.indexConfigState?.selectedFieldNames?.facet || new Set<string>()),
    display_fields: Array.from(state.dataState?.indexConfigState?.selectedFieldNames?.display || new Set<string>()),
    ui_settings: state.dataState?.indexConfigState?.searchState?.uiSettings,
    pageNum: state.dataState?.indexConfigState?.searchState?.pageNum || undefined,
    query: state.dataState?.indexConfigState?.searchState?.query || {}
  }),
  fromDto: async (
    dto: AppStateDto | undefined,
    getJson: (url: string) => Promise<any>
  ): Promise<AppState> => {
    let defaultAppState: AppState = {
      dataUrl: undefined,
      dataState: undefined
    };
    if(dto === undefined || !dto.url){
      return Promise.resolve(defaultAppState);
    }
    let data = await getJson(dto.url);
    if(!data){
      return defaultAppState;
    }
    return {
      dataUrl: dto.url,
      dataState: {
        rawData: data,
        recordsKey: dto.records_key,
        indexConfigState: tryGetIndexConfigState(dto, data)
      }
    };
  },
}