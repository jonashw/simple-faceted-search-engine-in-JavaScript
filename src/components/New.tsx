import React from "react";
import { CreateFacetedIndex, Query, UISettings, defaultUiSettings } from "../model";
import Search from "./Search";

export function New(){
    const [query,setQuery] = React.useState<Query>({});
    const ix = CreateFacetedIndex([
        {
            location: 'Sacramento',
            rating: 6
        },
        {
            location: 'Los Angeles',
            rating: 7
        },
        {
            location: 'San Francisco',
            rating: 9
        },
        {
            location: 'San Diego',
            rating: 10
        },
        {
            location: 'New York City',
            rating: 10
        },
    ], {
        facet_fields: [],
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

    return <Search {...{
        viewSettings: () => {
            console.log('view settings');
        },
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
    }}/>;
}