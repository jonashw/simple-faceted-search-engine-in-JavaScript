type UISettings = {[key:string]: string}
type UISettingControl<T> = {
    label: string,
    options: T[]
    defaultOption: T
    fromUrl: (str: string) => T,
    key: string
}
const uiSettingControls: UISettingControl<any>[] = [
  {
    label: 'Horizontal split',
    options: ['1/11','2/10','3/9','4/8'],
    defaultOption: '3/9',
    fromUrl: (str: string) => str,
    key: 'horizontalSplit'
  },
  {
    label: 'Records per row',
    options: [1, 2, 3, 4, 5],
    defaultOption: 2,
    fromUrl: str => parseInt(str),
    key: 'recordsPerRow'
  },
  {
    label: "Results per page",
    options: [10, 20, 50, 100],
    defaultOption: 20,
    fromUrl: str => parseInt(str),
    key: 'pageSize'
  }
];

const defaultUiSettings = Object.fromEntries(uiSettingControls.map(c => [c.key, c.defaultOption]));

export {uiSettingControls, type UISettingControl, type UISettings, defaultUiSettings};