import { uiSettingControls, UISettings } from "./ui/2.0/model/UISettings";

const qs_cfg = {
  ui_key: 'ui',
  facet_fields: 'ff',
  display_fields: 'df',
  records_url: 'url',
  records_key: 'key'
}

type URLSettings = {
    url: string;
    records_key: string | undefined;
    facet_fields: string[];
    display_fields: string[];
    ui_settings: UISettings
}

const URLCodec = {
  toUrlSearchParams: (s: URLSettings): URLSearchParams =>
    new URLSearchParams([
      [qs_cfg.records_url, s.url],
      ...(!s.records_key ? [] : [[qs_cfg.records_key, s.records_key]]),
      ...(!s.ui_settings ? [] : Object.entries(s.ui_settings).map(([k,v]) => [qs_cfg.ui_key + k, v])),
      ...s.facet_fields.map((f) => [qs_cfg.facet_fields, f]),
      ...s.display_fields.map((f) => [qs_cfg.display_fields, f])
    ].filter(([k,v]) => !!v)),
  fromUrlSearchParams: (params: URLSearchParams): URLSettings | undefined => {
    const paramsDict: {[key: string]: string[]} = Array.from(params.entries()).reduce(
      (dict, [key, value]) => {
        (dict[key] = dict[key] || []).push(value);
        return dict;
      },
      {} as {[key:string]: string[]}
    );
    if (!paramsDict[qs_cfg.records_url] || !paramsDict[qs_cfg.facet_fields]) {
      return undefined;
    }
    let ui_settings: UISettings =
      Object.fromEntries(uiSettingControls.map(c => {
        let value = c.fromUrl(params.getAll(qs_cfg.ui_key + '_' + c.key)[0]);
        return [
          c.key,
          (c.options.indexOf(value) > -1 ? value : c.defaultOption).toString()
        ];
      }));
    return {
      url: paramsDict[qs_cfg.records_url][0],
      records_key: paramsDict[qs_cfg.records_key] ? paramsDict[qs_cfg.records_key][0] : undefined,
      facet_fields: paramsDict[qs_cfg.facet_fields],
      display_fields: paramsDict[qs_cfg.display_fields],
      ui_settings
    };
  }
};

export {URLSettings, URLCodec};