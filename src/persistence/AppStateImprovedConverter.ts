import {
	Record,
	GetRecordsMetadata,
	CreateFacetedIndex,
	defaultUiSettings
} from '../model';
import * as asi from '../model/AppStateImproved';
import AppStateDto from './AppStateDto';

const tryGetIndexConfigState = (dto: AppStateDto, data: any): asi.IndexConfigState | undefined => {
	let recordsCandidate = !!dto.records_key ? data[dto.records_key] : data;
	if(!Array.isArray(recordsCandidate)){
		return undefined;
	}
	let records: Record[] = recordsCandidate;
	let metadata = GetRecordsMetadata(records);
	return {
		metadata,
		records,
		selectedFieldNames: {
			facet  : new Set<string>(dto.  facet_fields.length === 0 ? metadata.recommended_selections.  facet : dto.facet_fields  ),
			display: new Set<string>(dto.display_fields.length === 0 ? metadata.recommended_selections.display : dto.display_fields)
		},
		searchState: tryGetSearchState(dto, records)
	};
};

const tryGetSearchState = (dto: AppStateDto, records: Record[]): undefined | asi.SearchState => {
  if(dto.facet_fields.length === 0 || dto.display_fields.length === 0){
    return undefined;
  }
  let index = CreateFacetedIndex(records, {
    display_fields: dto.display_fields,
    facet_fields: dto.facet_fields,
    facet_term_parents: {}
  });
  return {
    index,
    pageNum: 1,
    pageSize: 200,
    query: dto.query,
    uiSettings: dto.ui_settings || defaultUiSettings
  }
};

export default {
  toDto: (state: asi.AppState): AppStateDto => ({
    url: state.dataUrl,
    records_key: state.dataState?.recordsKey,
    facet_fields: Array.from(state.dataState?.indexConfigState?.selectedFieldNames?.facet || new Set<string>()),
    display_fields: Array.from(state.dataState?.indexConfigState?.selectedFieldNames?.display || new Set<string>()),
    ui_settings: state.dataState?.indexConfigState?.searchState?.uiSettings,
    query: state.dataState?.indexConfigState?.searchState?.query || {}
  }),
  fromDto: async (
    dto: AppStateDto | undefined,
    getJson: (url: string) => Promise<any>
  ): Promise<asi.AppState> => {
    let defaultAppState: asi.AppState = {
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