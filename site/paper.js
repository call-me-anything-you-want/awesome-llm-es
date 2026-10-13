const stepDefinitions = [
  ['ch3', 'Population & archives'],
  ['parentSelection', 'Parent selection'],
  ['ch4', 'Candidate generation'],
  ['ch5', 'Foundation models'],
  ['ch6', 'Evaluation & feedback'],
  ['populationUpdate', 'Population update'],
  ['ch7', 'Exploration–exploitation']
];

function addText(parent, tagName, text, className = '') {
  const element = document.createElement(tagName);
  element.textContent = text;
  if (className) element.className = className;
  parent.append(element);
  return element;
}

function appendInlineMath(parent, text) {
  const source = String(text ?? '');
  const pattern = /\\\(([^]*?)\\\)/g;
  let cursor = 0;
  let match;
  while ((match = pattern.exec(source))) {
    if (match.index > cursor) parent.append(document.createTextNode(source.slice(cursor, match.index)));
    const formula = match[1].trim().replace(/\\mathrm\{([^}]+)\}/g, '$1');
    const formulaElement = document.createElement('span');
    formulaElement.className = 'inline-math';
    const subscript = formula.match(/^([A-Za-z]+)_\{([^}]+)\}$/) || formula.match(/^([A-Za-z]+)_([A-Za-z0-9+]+)$/);
    if (subscript) {
      formulaElement.append(document.createTextNode(subscript[1]));
      const sub = document.createElement('sub');
      sub.textContent = subscript[2];
      formulaElement.append(sub);
    } else {
      formulaElement.textContent = formula;
    }
    parent.append(formulaElement);
    cursor = pattern.lastIndex;
  }
  if (cursor < source.length) parent.append(document.createTextNode(source.slice(cursor)));
}

function addRichText(parent, tagName, text, className = '') {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  appendInlineMath(element, text);
  parent.append(element);
  return element;
}

function normalizeAuthors(value) {
  if (Array.isArray(value)) return value.filter(Boolean).map((author) => String(author).trim());
  if (typeof value === 'string') return value.split(/\s+and\s+/).map((author) => author.trim()).filter(Boolean);
  return [];
}

function formatFullAuthors(value) {
  const authors = normalizeAuthors(value);
  if (authors.length <= 1) return authors[0] || 'Authors not specified';
  if (authors.length === 2) return `${authors[0]} and ${authors[1]}`;
  return `${authors.slice(0, -1).join(', ')}, and ${authors[authors.length - 1]}`;
}

function renderTags(evidence) {
  const container = document.querySelector('#paper-tags');
  const mechanism = evidence.mechanism || {};
  const recordedTags = evidence.tags || stepDefinitions
    .filter(([key]) => (evidence.surveyPlacement?.chapters?.[key] || []).length)
    .map(([, label]) => label);
  const replacement = String(mechanism.replacement || '').trim();
  if (replacement && !['incremental_insertion', 'unclear', 'none', 'none_clear'].includes(replacement) && !recordedTags.includes('Population update')) {
    recordedTags.push('Population update');
  }
  const tags = stepDefinitions
    .map(([, label]) => label)
    .filter((label) => recordedTags.includes(label));
  tags.filter((tag) => {
    if (tag === 'Foundation models' && mechanism.modelSetting === 'single_model') return false;
    if (tag === 'Evaluation & feedback' && mechanism.evaluation === 'scalar_objective') return false;
    if (tag === 'Exploration–exploitation' && mechanism.explorationExploitation === 'implicit') return false;
    return true;
  })
    .forEach((label) => addText(container, 'span', label, 'paper-tag'));
}

const mechanismLabels = {
  flat_multi: 'Flat multi-individual population',
  single: 'Single individual',
  island: 'Island-structured population',
  tree: 'Tree-structured population',
  hybrid: 'Hybrid structure',
  multi_elite: 'Multi-elite archive',
  single_elite: 'Single-elite archive',
  qd_archive: 'Quality-diversity archive',
  elitist_replacement: 'Elitist replacement',
  incremental_insertion: 'Incremental insertion',
  generational_replacement: 'Generational replacement',
  from_scratch: 'From-scratch generation',
  large_scale_modification: 'Large-scale modification',
  localized_modification: 'Localized modification',
  multi_parent_fusion: 'Multi-parent fusion',
  single_model: 'Single-model setting',
  multi_model: 'Multi-model setting',
  scalar_objective: 'Scalar objective',
  vector_objective: 'Vector objective',
  preference: 'Preference-based evaluation',
  fitness_based: 'Fitness-based selection',
  fitness_based_sampling: 'Fitness-based sampling',
  fitness_proportional: 'Fitness-proportional selection',
  fitness_proportional_softmax: 'Fitness-proportional softmax sampling',
  score_based: 'Score-based selection',
  rank_based: 'Rank-based selection',
  uniform_archive_sampling: 'Uniform archive sampling',
  retrieval_based: 'Retrieval-based selection',
  search_statistic_based: 'Search-statistic-based selection',
  evaluator_metadata_based: 'Evaluator-metadata-based selection',
  current_incumbent: 'Current-incumbent selection',
  tournament: 'Tournament selection',
  uct: 'UCT selection',
  UCB: 'UCB selection'
};

function humanizeMechanismToken(token) {
  const clean = token.trim();
  if (clean === 'unclear') return 'Unclear from available evidence';
  if (mechanismLabels[clean]) return mechanismLabels[clean];
  return clean.replace(/_/g, ' ').replace(/\s+/g, ' ').replace(/^./, (character) => character.toUpperCase());
}

function formatMechanismValue(value, fieldLabel) {
  if (!value) return '';
  const noneLabel = {
    Population: 'No explicit population structure',
    Archive: 'No explicit archive',
    Replacement: 'No explicit replacement rule',
    Generation: 'No explicit generation mechanism',
    'Parent selection': 'No explicit parent selection'
  }[fieldLabel] || 'Not explicitly specified';
  return String(value).split('|').map((token) => {
    const clean = token.trim();
    if (clean === 'none') return noneLabel;
    if (clean === 'none_clear') return 'No explicit population structure';
    if (clean === 'none_no_parent_selection') return 'No explicit parent selection';
    if (clean === 'none_new_idea_conditioned_on_archive') return 'No explicit parent selection';
    return humanizeMechanismToken(clean);
  }).join(' · ');
}

function formatMechanismDetail(detail) {
  if (!detail || detail.trim().toLowerCase() === 'none') return '';
  return detail.replace(/\bnone_explicit\b/gi, 'no explicit parent selection');
}

function renderMechanism(evidence) {
  const container = document.querySelector('#mechanism-table');
  const rows = [
    ['Population', evidence.mechanism.population, evidence.mechanism.populationDetail],
    ['Archive', evidence.mechanism.archive, evidence.mechanism.archiveDetail],
    ['Parent selection', evidence.mechanism.parentSelection, evidence.mechanism.parentSelectionDetail],
    ['Generation', evidence.mechanism.generation, evidence.mechanism.generationDetail],
    ['Model setting', evidence.mechanism.modelSetting, ''],
    ['Evaluation', evidence.mechanism.evaluation, evidence.mechanism.feedbackDetail],
    ['Replacement', evidence.mechanism.replacement, evidence.mechanism.replacementDetail],
    ['Explore–exploit', evidence.mechanism.explorationExploitation, '']
  ];
  rows.filter(([, value, detail]) => value || detail).forEach(([label, value, detail]) => {
    const row = document.createElement('div');
    row.className = 'mechanism-row';
    addText(row, 'span', label);
    const content = document.createElement('div');
    addText(content, 'strong', formatMechanismValue(value, label) || 'Not explicitly specified');
    const readableDetail = formatMechanismDetail(detail);
    if (readableDetail) addRichText(content, 'p', readableDetail);
    row.append(content);
    container.append(row);
  });
}

async function loadPaper() {
  const key = new URLSearchParams(window.location.search).get('key');
  try {
    document.querySelector('.paper-detail-overview h2')?.remove();
    document.querySelector('#paper-task')?.classList.add('paper-task');
    const manifest = await fetch('data/papers/index.json', { cache: 'no-cache' }).then((response) => response.json());
    const entry = (manifest.records || []).find((record) => record.key === key);
    if (!entry) throw new Error('Missing paper record');
    const evidence = await fetch(`data/papers/${encodeURIComponent(entry.file)}`, { cache: 'no-cache' }).then((response) => response.json());

    document.title = `${evidence.title} · Awesome LLM-ES`;
    const titleElement = document.querySelector('#paper-title');
    titleElement.replaceChildren();
    appendInlineMath(titleElement, evidence.title);
    document.querySelector('#paper-authors').textContent = formatFullAuthors(evidence.authors);
    document.querySelector('#paper-year-value').textContent = evidence.year;
    document.querySelector('#paper-venue').textContent = evidence.venue;
    document.querySelector('#paper-task').textContent = evidence.mechanism.domainTask || 'Task details not specified.';
    renderTags(evidence);
    renderMechanism(evidence);
    const external = document.querySelector('#paper-external');
    if (evidence.publication?.url || evidence.publication?.doi || evidence.publication?.eprint) {
      external.href = evidence.publication.url
        || (evidence.publication.doi ? `https://doi.org/${evidence.publication.doi}` : `https://arxiv.org/abs/${evidence.publication.eprint}`);
      external.hidden = false;
    }
  } catch (error) {
    document.querySelector('#paper-title').textContent = 'Paper record unavailable';
    document.querySelector('#paper-error').hidden = false;
    console.error(error);
  }
}

if (window.lucide) window.lucide.createIcons({ attrs: { 'stroke-width': 2.35 } });
loadPaper();
