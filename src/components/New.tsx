import React from "react";
import { CreateFacetedIndex, Query, UISettings, defaultUiSettings } from "../model";
import Search from "./Search";
import RecordTermTable from "./RecordTermTable";

const words = (paragraph: string) =>
    paragraph.trim().replace(/\n/g," ").split(" ").filter(w => !!w);

const colors = words(`
    Ultramarine Viridian Scarlet Grey Ochre Magenta Cyan 
    Cerulean Cobalt Ivory Sienna Umber Titanium
`);

const animals = words(`
    Raccoon Border Collie Lemur Axolotl Gibbon
    Octopus Koala Bunny Shark Turtle Puppy Kitty
`);

const randomWord = (words: string[]): string =>
    words.length == 0 
    ? ""
    : words[Math.floor(words.length * Math.random())];

type MyRecord = {
    location: string;
    rating: 1 | 2 | 3 | 4 | 5;
    name: string;
};

const ix = CreateFacetedIndex<MyRecord>(Array(5).fill([
    {
        location: 'Sacramento',
        rating: 2
    },
    {
        location: 'Los Angeles',
        rating: 3
    },
    {
        location: 'San Francisco',
        rating: 4
    },
    {
        location: 'San Diego',
        rating: 5
    },
    {
        location: 'New York City',
        rating: 5
    },
]).flatMap(arr => arr.map((record: MyRecord) => ({
    ...record,
    name: `${randomWord(colors)} ${randomWord(animals)}`
}))), {
        facet_fields: ['location','rating'],
        display_fields: [],
        facet_term_parents: {
            location: {
                'Sacramento': 'California',
                'Los Angeles': 'California',
                'San Francisco': 'California',
                'San Diego': 'California',
                'New York City': 'New York',
                'New York': 'USA',
                'California': 'USA'
            }
        }
    });

export function New(){
    const [query,setQuery] = React.useState<Query>({});
    const toggleQueryTerm = (facet_id: string, term: string) => {
        const newQuery = ix.toggleQueryTerm(query, facet_id, term);
        setQuery(newQuery);
    };

    const [showTermTables, setShowTermTables] = React.useState<boolean>(false);

    return <div>
        <nav className="navbar navbar-expand-lg navbar-light bg-light mb-3">
            <div className="container-fluid d-flex justify-content-between align-items-center">
                <a className="navbar-brand h1" href="#">Faceted Search</a>
                <div className="form-check">
                    <input
                        className="form-check-input"
                        type="checkbox"
                        checked={showTermTables}
                        onChange={e => setShowTermTables(e.target.checked)}
                        id="showTermTables"
                    />
                    <label
                        className="form-check-label"
                        htmlFor="showTermTables"
                    >Show Term Tables</label>
                </div>
            </div>
        </nav>
        <div className="container-fluid">
            <Search<MyRecord> {...{
                recordTemplate: (r, searchResult) => (
                    <>
                        <div className="d-flex justify-content-between">
                            <h5>{r.location}</h5>
                            <div>
                                {Array(r.rating).fill(undefined).map(() => "★").join('')}
                                {Array(5-r.rating).fill(undefined).map(() => "☆").join('')}
                            </div>
                        </div>
                        <div>
                            {r.name}
                        </div>
                        {showTermTables && <div className="mt-2">
                            <RecordTermTable
                                record={r}
                                facetIds={searchResult.facets.map(f => f.facet_id)}
                                onClick={toggleQueryTerm}
                                facetTermCount={searchResult.facetTermCount}
                                thWidth={undefined}
                                className={"mb-0"}
                            />
                        </div>}
                    </>
                ),
                showTermTables:false,
                currentPageNumber: 1,
                setCurrentPageNumber: (p: number) => {
                    console.log('set page to ' + p);
                },
                ix,
                debug: false,
                uiSettingControls: [],
                query,
                setQuery,
                setUiSettings: (ui: UISettings) => {
                    console.log('setUiSettings', ui);
                },
                uiSettings: defaultUiSettings
            }}/>
        </div>
    </div>;
}