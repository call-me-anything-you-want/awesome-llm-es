# Awesome LLM-ES

The companion website for the survey **A Comprehensive Survey on LLM-Guided Evolutionary Search**.

Live site: [call-me-anything-you-want.github.io/awesome-llm-es](https://call-me-anything-you-want.github.io/awesome-llm-es/)

## Survey paper

- [Read the manuscript](https://www.preprints.org/manuscript/202610.1122/v1)
- [Download the PDF](https://call-me-anything-you-want.github.io/awesome-llm-es/assets/llm-guided-evolutionary-search-survey.pdf)
- [Open the survey section on the website](https://call-me-anything-you-want.github.io/awesome-llm-es/#survey)

BibTeX:

```bibtex
@article{202610.1122,
  doi = {10.20944/preprints202610.1122.v1},
  url = {https://doi.org/10.20944/preprints202610.1122.v1},
  year = {2026},
  month = {October},
  publisher = {Preprints},
  author = {Dongbin Zhao and Sicheng Li and Xiaobing Yang and Kaixuan Xu and Zhongyue Zhao and Binbin Zuo and Mingfei Wang and Zijie Zhao and Yuanheng Zhu},
  title = {A Comprehensive Survey on LLM-Guided Evolutionary Search},
  journal = {Preprints}
}
```

## What this site contains

The site turns the survey taxonomy into an interactive research atlas:

- a comparison of hand-coded, LLM-guided, and evolutionary workflows;
- a nine-layer system map covering the search loop;
- a research timeline with 29 selected milestones;
- application views across five domains;
- nine open-source frameworks and thirteen public benchmarks;
- a paper explorer with 136 reviewed records and detail pages.

## Repository layout

```text
site/
  index.html       Main site and survey page
  layer.html       System-map layer detail page
  paper.html       Paper detail page
  app.js           Main page rendering and interactions
  layer.js         Layer detail rendering
  paper.js         Paper detail rendering
  styles.css       Shared responsive styles
  data/
    papers/        One JSON record per paper plus index.json
    reference.bib  Bibliography entries used by the site
    *.json         Framework, benchmark, timeline, layer, and claim data
  assets/          Public images and the survey PDF
.github/workflows/pages.yml
                   GitHub Pages deployment workflow
```

## Maintaining paper records

Each paper is stored in its own JSON file under `site/data/papers/`. The explorer reads the list from `site/data/papers/index.json`, so adding or removing a file also requires updating that manifest.

### Add a paper

1. Create `site/data/papers/<stable-key>.json`. Use lowercase letters, numbers, and hyphens for a new key where possible.
2. Add one matching record to `site/data/papers/index.json`:

   ```json
   { "key": "example-paper", "file": "example-paper.json" }
   ```

3. Add the paper's BibTeX entry to `site/data/reference.bib` when a usable citation is available.
4. Use an authors array, keep publication links explicit, and use `unclear` for mechanisms that the source does not specify. Do not infer a mechanism from the title or abstract alone.

A minimal paper record looks like this:

```json
{
  "schemaVersion": 1,
  "key": "example-paper",
  "paperKey": "example-paper",
  "bibliographyKey": "example2026",
  "title": "Example Paper",
  "authors": ["First Author", "Second Author"],
  "year": 2026,
  "venue": "arXiv",
  "publication": {
    "url": "https://example.org/paper",
    "archive": "arXiv",
    "status": "preprint",
    "doi": null,
    "eprint": null
  },
  "tags": ["Candidate generation"],
  "mechanism": {
    "domainTask": "Short description of the evolved task",
    "population": "unclear",
    "archive": "unclear",
    "parentSelection": "unclear",
    "generation": "unclear",
    "modelSetting": "unclear",
    "evaluation": "unclear",
    "replacement": "unclear",
    "explorationExploitation": "unclear"
  }
}
```

When possible, copy an existing paper record and change only the paper-specific fields. The mechanism values and tag labels should follow the vocabulary already used in the existing records and system map.

### Remove or correct a paper

Delete the paper JSON file, remove its record from `site/data/papers/index.json`, and remove or update its BibTeX entry if it is no longer used. For a correction, keep the stable key and edit the existing JSON record so links to the paper page do not change.

## Contributing

New relevant papers are welcome, including papers authored by contributors. To propose an addition or correction:

1. Fork the repository and create a focused branch.
2. Add or edit the paper JSON, manifest entry, and BibTeX entry as needed.
3. Run the site locally and check the paper explorer and detail page.
4. Open a pull request with the source URL, publication status, and a short explanation of the mechanism labels.

Please keep claims tied to the paper itself. If a step is not described clearly, leave the corresponding mechanism as `unclear` instead of assigning a more specific tag.

## Run locally

The site is static and does not require a build step. From the repository root, run:

```powershell
python -m http.server 8765 --directory site
```

Then open <http://127.0.0.1:8765/> in a browser. A local HTTP server is recommended because the site loads its JSON data with relative `fetch()` requests.

## Deployment

The workflow in `.github/workflows/pages.yml` uploads the `site/` directory to GitHub Pages whenever a commit is pushed to `main`. No framework build or package installation is required.

## License

No license is declared yet. Add a license file before treating the repository as a reusable software or data package.
