DELETE FROM "public"."content" WHERE "id" = 'page/dataset-quality';
INSERT INTO "public"."content" ("id", "type", "content") VALUES 
('page/linked-data-rating.md', 'application/json', '{"title": "Dataset Linked Data Rating","content": "\n## How we calculate the linked data rating\nOur linked data ratings are an automatic rating based on the licensing, format and availability of data, derived from (but different to) Tim Berners-Lee’s [5-star linked data system](https://www.w3.org/2011/gld/wiki/5_Star_Linked_Data).\nA dataset is given the rating of its best file or API – for example, if a dataset has 3 files rated at 1 star, 2 stars and 3 stars, the whole dataset will have a 3-star rating. The criteria for each star rating is described below.\nWe will continue to update the Linked Data Rating as research continues. If you have any feedback – particularly if you feel that a certain dataset has been misclassified – please contact us at [contact@magda.io](mailto:contact@magda.io).\n### ⭐ Is the data available on the web, and does it have an open license?\nThis has two components – whether we were able to successfully check that the URL for the data is working, and whether its declared license matched our list of open licenses.\nWhen a dataset is indexed by Magda, we automatically check every file or API link to make sure it’s not broken. The link will be marked as broken if it doesn’t respond (and times out), returns an error or not found HTTP code, requires a login to access, doesn’t support an HTTP HEAD request, or rate-limits our crawler without returning the correct HTTP code (429) so that we know to slow down our requests.\nIf a dataset’s links are all broken it will be marked as zero stars.\nThe list of data licenses that we consider to be open is based on [the opendefinition.org list of Conformant Licenses](https://opendefinition.org/licenses/). You can find the list we use [here](https://github.com/TerriaJS/magda/blob/master/magda-minion-linked-data-rating/src/openLicenses.ts).\nEssentially, if a dataset declares a license field with text containing one of those licenses (for example,  “CC0” contains “CC”), then we assume that it’s open.\n### ⭐⭐ Is the data available as structured, machine-readable data?\nTo get 2 stars, the data must qualify for 1-star and also be structured and machine-readable. So data contained in images, plain text, Microsoft Word documents and Portable Document Files (PDF) do not qualify, but machine readable formats such as Microsoft Excel files do.\nWe determine this by comparing the file’s format against a list of formats that we understand to be 2-star formats – you can see the list [here](https://github.com/TerriaJS/magda/blob/master/magda-minion-linked-data-rating/src/openFormats.ts#L2).\n### ⭐⭐⭐ Is it available in a non-proprietary format?\nTo get 3 stars, the data must qualify for 2-star (machine-readable) but also be available in a [non-proprietary](https://en.oxforddictionaries.com/definition/non-proprietary) format. For example, plain comma-separated values (CSV), JSON and XML documents are all formats that are in the public domain or open standards, while a Microsoft Access MDB file is not.\nWe determine this by comparing the file’s format against a list of formats that we understand to be 3-star formats – you can see the list [here](https://github.com/TerriaJS/magda/blob/master/magda-minion-linked-data-rating/src/openFormats.ts#L3).\n### ⭐⭐⭐⭐ Does the data declare a schema?\nTo get 4 stars, data must not only be available in a non-proprietary, machine readable format, but also specify some kind of schema – meaning the data isn’t just readable by machines, but also includes metadata that allows it to be understood by machines. This usually means that it’s specified in an open, Linked Data format that includes the schema inside the data such as [RDF](https://en.wikipedia.org/wiki/Resource_Description_Framework) or [JSON-LD](https://en.wikipedia.org/wiki/JSON-LD), or uses a non-proprietary format that enforces a schema, such as [CSV GEO AU](https://github.com/TerriaJS/nationalmap/wiki/csv-geo-au).\nCurrently we determine this by comparing the file’s format against a list of formats that we understand to be 4-star formats – you can see the list [here](https://github.com/TerriaJS/magda/blob/master/magda-minion-linked-data-rating/src/openFormats.ts#L21).\n### ⭐⭐⭐⭐⭐ Does the data link to other data?\n5-star datasets are those that link to other data – for example, a dataset that included “Canberra” as a value for something wouldn’t simply include the word “Canberra”, but a link to data about Canberra, [such as its record in Geonames](http://sws.geonames.org/2172517/about.rdf).\n5-star datasets are very rare, and our automated process (currently) is not yet able to determine which datasets qualify for 5 stars.\n"}') ON CONFLICT DO NOTHING;