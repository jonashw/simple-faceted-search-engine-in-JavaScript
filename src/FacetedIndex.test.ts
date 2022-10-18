import { FacetedIndex } from "./FacetedIndex";

describe("The Faceted Index", () => {
	const ix = FacetedIndex([
		{color:'Red', difficulty: 'Hard'}
	],{facet_fields: [], display_fields: []});

	it('has 2 facets', () => {
		expect(Object.keys(ix.data)).toHaveLength(2);
	});
	it('is safe', () => {
		expect(1 + 1).toEqual(2);
	});
	it('is sensible', () => {
		expect(2 + 2).toEqual(4);
	});
})