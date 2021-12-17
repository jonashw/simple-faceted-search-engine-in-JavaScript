# Simple Faceted Search Engine

This is a dependency-free implementation of faceted search in JavaScript. It is presently embedded in a simple react application with randomly generated test data.

It performs well enough with up to 1000 simple records. I have not optimized it.

Configuration of the index is minimal; just pass an array of objects to have each and every unique property treated as a separate facet.

Requirements:

- all record keys are strings
- all record values are simple primitives (string, number)

Features:

- record values can be single-value or multi-value (a primitive or an array of primitives)
- The UI allows you to paste your own records data in JSON format and configure the search index appropriately to your data

Try it out: https://faceted-search.netlify.app/