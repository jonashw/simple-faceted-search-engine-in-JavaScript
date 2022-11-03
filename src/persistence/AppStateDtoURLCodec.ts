import { uiSettingControls, UISettings } from "../model/UISettings";
import AppStateDto from "./AppStateDto";

const qs_cfg = {
  ui_key: 'ui_',
  facet_fields: 'ff',
  display_fields: 'df',
  records_url: 'url',
  records_key: 'key',
  query_facet: 'q_',
  page_num: 'p',
}

const serialize = (dto: AppStateDto) => 
  new URLSearchParams([
    ...(!dto.url ? [] : [[qs_cfg.records_url, dto.url]]),
    ...(!dto.pageNum ? [] : [[qs_cfg.page_num, dto.pageNum.toString()]]),
    ...(!dto.records_key ? [] : [[qs_cfg.records_key, dto.records_key]]),
    ...(!dto.ui_settings ? [] : Object.entries(dto.ui_settings).map(([k,v]) => [qs_cfg.ui_key + k, v])),
    ...dto.facet_fields.map((f) => [qs_cfg.facet_fields, f]),
    ...dto.display_fields.map((f) => [qs_cfg.display_fields, f]),
    ...Object.entries(dto.query).flatMap(([facetName,terms]) => terms.map(t => [qs_cfg.query_facet + facetName, t] ))
  ].filter(([k,v]) => !!v));

const deserialize = (params: URLSearchParams): AppStateDto | undefined => {
  const paramsDict: {[key: string]: string[]} = Array.from(params.entries()).reduce(
    (dict, [key, value]) => {
      (dict[key] = dict[key] || []).push(value);
      return dict;
    },
    {} as {[key:string]: string[]}
  );
  if (!paramsDict[qs_cfg.records_url]) {
    return undefined;
  }
  let ui_settings: UISettings =
    Object.fromEntries(uiSettingControls.map(c => {
      let value = c.fromUrl(params.getAll(qs_cfg.ui_key + c.key)[0]);
      return [
        c.key,
        (c.options.indexOf(value) > -1 ? value : c.defaultOption).toString()
      ];
    }));
  let query = 
    Array.from(params.entries())
    .filter(([key,value] : [string,string]) => key.indexOf(qs_cfg.query_facet) === 0)
    .reduce((dict: {[facetName: string]: string[]}, [key,value]: [string,string]) => {
      let facetName = key.replace(qs_cfg.query_facet, '');
      dict[facetName] = dict[facetName] || [];
      dict[facetName].push(value);
      return dict;
    }, {});
    console.log('query',query);
  return {
    url: paramsDict[qs_cfg.records_url][0],
    pageNum: paramsDict[qs_cfg.page_num] ? (parseInt(paramsDict[qs_cfg.page_num][0]) || undefined) : undefined,
    records_key: paramsDict[qs_cfg.records_key] ? paramsDict[qs_cfg.records_key][0] : undefined,
    facet_fields: paramsDict[qs_cfg.facet_fields] || [],
    display_fields: paramsDict[qs_cfg.display_fields] || [],
    ui_settings,
    query
  };
};

export {serialize, deserialize};