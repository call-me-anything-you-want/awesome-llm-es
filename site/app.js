const progressBar = document.querySelector('.scroll-progress span');

function refreshIcons() {
  if (window.lucide) window.lucide.createIcons({ attrs: { 'stroke-width': 2.35 } });
}

function updateProgress() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const progress = max > 0 ? window.scrollY / max : 0;
  progressBar.style.width = String(progress * 100) + '%';
}

window.addEventListener('scroll', updateProgress, { passive: true });
updateProgress();
refreshIcons();

const surveyBibtexButton = document.querySelector('#copy-survey-bibtex');
if (surveyBibtexButton) {
  surveyBibtexButton.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(surveyBibtexButton.dataset.bibtex || '');
    } catch (error) {
      // Keep the button label stable; clipboard permissions can fail silently.
    }
  });
}

const revealItems = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

revealItems.forEach((item) => revealObserver.observe(item));

const mapNodes = document.querySelectorAll('.map-node');

// Keep the fixed navigation aligned with the section currently occupying the viewport.
const sectionNavLinks = [...document.querySelectorAll('.nav-links a[href^="#"]')];
const sectionNavTargets = sectionNavLinks
  .map((link) => ({ link, section: document.querySelector(link.getAttribute('href')) }))
  .filter(({ section }) => section);
const terminalSection = document.querySelector('#survey');

function setCurrentSection(sectionId) {
  sectionNavLinks.forEach((link) => {
    const isCurrent = link.getAttribute('href') === '#' + sectionId;
    link.classList.toggle('is-current', isCurrent);
    if (isCurrent) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
}

function updateCurrentSection() {
  if (!sectionNavTargets.length) return;
  const marker = window.innerHeight * .34;
  if (terminalSection && terminalSection.getBoundingClientRect().top <= marker) {
    setCurrentSection('');
    return;
  }
  let current = null;
  sectionNavTargets.forEach(({ section }) => {
    if (section.getBoundingClientRect().top <= marker) current = section;
  });
  if (current) setCurrentSection(current.id);
  else setCurrentSection('');
}

if (sectionNavTargets.length) {
  sectionNavLinks.forEach((link) => link.addEventListener('click', () => {
    const sectionId = link.getAttribute('href').slice(1);
    setCurrentSection(sectionId);
  }));
  window.addEventListener('scroll', updateCurrentSection, { passive: true });
  window.addEventListener('resize', updateCurrentSection, { passive: true });
  updateCurrentSection();
}

function selectMapNode(node) {
  mapNodes.forEach((item) => item.classList.toggle('active', item === node));
}

selectMapNode(document.querySelector('.map-node.active'));

const mapGrid = document.querySelector('.map-grid');
const canHoverMap = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const mapCopyLayouts = {
  '01': { left: 50, top: 16, width: 24, angle: -90 },
  '02': { left: 75, top: 24.5, width: 26, angle: -45 },
  '03': { left: 88, top: 50, width: 24, angle: 0 },
  '04': { left: 76, top: 74, width: 24, angle: 45 },
  '05': { left: 50, top: 80.5, width: 24, angle: 90 },
  '06': { left: 24, top: 74, width: 24, angle: 135 },
  '07': { left: 12, top: 50, width: 24, angle: 180 },
  '08': { left: 25, top: 24.5, width: 26, angle: 225 }
};

if (mapGrid && canHoverMap) {
  function setMapFocus(link) {
    if (!link || !mapGrid.contains(link)) return;
    if (mapGrid.dataset.focusedLayer === link.dataset.number) return;

    const focusedIndex = Number(link.dataset.number) - 1;
    mapGrid.querySelectorAll('.layer-sector').forEach((sector) => {
      const layout = mapCopyLayouts[sector.dataset.number];
      const sectorIndex = Number(sector.dataset.number) - 1;
      let delta = (sectorIndex - focusedIndex + 8) % 8;
      if (delta > 4) delta -= 8;

      sector.classList.toggle('is-map-focus', sector === link);
      sector.style.removeProperty('--focus-away-rotation');
      sector.style.removeProperty('--focus-copy-left');
      sector.style.removeProperty('--focus-copy-top');
      sector.style.removeProperty('--focus-copy-width');

      if (sector === link || !layout) return;

      const awayRotation = Math.sign(delta) * (4 - Math.abs(delta)) * 4;
      const angle = layout.angle * Math.PI / 180;
      const away = awayRotation * Math.PI / 180;
      const x = layout.left - 50;
      const y = layout.top - 50;
      const radial = x * Math.cos(angle) + y * Math.sin(angle);
      const tangent = -x * Math.sin(angle) + y * Math.cos(angle);
      const squeezedX = radial * 1.08 * Math.cos(angle) - tangent * .78 * Math.sin(angle);
      const squeezedY = radial * 1.08 * Math.sin(angle) + tangent * .78 * Math.cos(angle);
      const rotatedX = squeezedX * Math.cos(away) - squeezedY * Math.sin(away);
      const rotatedY = squeezedX * Math.sin(away) + squeezedY * Math.cos(away);

      sector.style.setProperty('--focus-away-rotation', awayRotation + 'deg');
      sector.style.setProperty('--focus-copy-left', (50 + rotatedX * .92) + '%');
      sector.style.setProperty('--focus-copy-top', (50 + rotatedY * .92) + '%');
      sector.style.setProperty('--focus-copy-width', (layout.width * .8) + '%');
    });
    mapGrid.dataset.focusedLayer = link.dataset.number;
  }

  function clearMapFocus() {
    delete mapGrid.dataset.focusedLayer;
    mapGrid.querySelectorAll('.layer-sector').forEach((sector) => {
      sector.classList.remove('is-map-focus');
      sector.style.removeProperty('--focus-away-rotation');
      sector.style.removeProperty('--focus-copy-left');
      sector.style.removeProperty('--focus-copy-top');
      sector.style.removeProperty('--focus-copy-width');
    });
  }

  document.addEventListener('pointermove', (event) => {
    if (!mapGrid.hasAttribute('data-focused-layer')) {
      const bounds = mapGrid.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) return;
    }

    const target = document.elementFromPoint(event.clientX, event.clientY);
    const link = target?.closest?.('.layer-sector');
    if (link && mapGrid.contains(link)) setMapFocus(link);
    else if (mapGrid.hasAttribute('data-focused-layer')) clearMapFocus();
  }, { passive: true });

  mapGrid.addEventListener('focusin', (event) => {
    const link = event.target.closest('.layer-sector');
    if (link) setMapFocus(link);
  });

  mapGrid.addEventListener('focusout', () => {
    window.requestAnimationFrame(() => {
      const link = document.activeElement?.closest?.('.layer-sector');
      if (link && mapGrid.contains(link)) setMapFocus(link);
      else clearMapFocus();
    });
  });
}

const layerLinks = document.querySelectorAll('[data-layer-link]');
layerLinks.forEach((link) => link.addEventListener('click', () => {
  window.sessionStorage.setItem('layerMapReturn', JSON.stringify({
    number: link.dataset.number,
    scrollY: window.scrollY
  }));
}));

try {
  const returnState = JSON.parse(window.sessionStorage.getItem('layerMapReturn') || 'null');
  if (returnState) {
    window.sessionStorage.removeItem('layerMapReturn');
    const selected = [...mapNodes].find((node) => node.dataset.number === returnState.number);
    if (selected) selectMapNode(selected);
    if (Number(returnState.scrollY) > 0) {
      window.setTimeout(() => window.scrollTo(0, Number(returnState.scrollY)), 80);
    }
  }
} catch (error) {
  window.sessionStorage.removeItem('layerMapReturn');
}

const resourceTabs = document.querySelectorAll('.resource-tab');
const resourcePanels = document.querySelectorAll('.resource-panel');

resourceTabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    resourceTabs.forEach((item) => {
      const selected = item === tab;
      item.classList.toggle('active', selected);
      item.setAttribute('aria-selected', String(selected));
    });

    resourcePanels.forEach((panel) => {
      const selected = panel.id === tab.dataset.panel;
      panel.classList.toggle('active', selected);
      panel.hidden = !selected;
    });
  });
});

async function fetchJson(path) {
  const response = await fetch(path, { cache: 'no-cache' });
  if (!response.ok) throw new Error('Unable to load ' + path);
  return response.json();
}

async function loadPaperRecords(records) {
  const papers = [];
  for (let start = 0; start < records.length; start += 8) {
    const batch = records.slice(start, start + 8);
    papers.push(...await Promise.all(batch.map(({ file }) => fetchJson(`data/papers/${encodeURIComponent(file)}`))));
  }
  return papers;
}

function loadPapersWhenVisible(records) {
  const section = document.querySelector('#papers');
  const observer = new IntersectionObserver((entries) => {
    if (!entries.some((entry) => entry.isIntersecting)) return;
    observer.disconnect();
    loadPaperRecords(records)
      .then((papers) => {
        renderPapers(papers);
        updateProgress();
      })
      .catch(showDataError);
  }, { rootMargin: '600px 0px' });
  observer.observe(section);
}

function normalizeAuthors(value) {
  if (Array.isArray(value)) return value.filter(Boolean).map((author) => String(author).trim());
  if (typeof value === 'string') return value.split(/\s+and\s+/).map((author) => author.trim()).filter(Boolean);
  return [];
}

function formatCardAuthors(value) {
  const authors = normalizeAuthors(value);
  if (authors.length <= 1) return authors[0] || 'Authors not specified';
  return `${authors[0]} et al.`;
}

function renderStatistics(site, frameworks, benchmarks) {
  const values = {
    citedWorks: String(site.citedWorks) + '+',
    frameworks: String(frameworks.length),
    benchmarks: String(benchmarks.length),
    applicationDomains: String(site.applicationDomains),
    systemLayers: String(site.systemLayers)
  };

  document.querySelectorAll('[data-stat]').forEach((element) => {
    element.textContent = values[element.dataset.stat];
  });

  document.querySelectorAll('[data-count]').forEach((element) => {
    element.textContent = values[element.dataset.count];
  });
}

function renderFrameworks(frameworks) {
  const container = document.querySelector('[data-resource-list="frameworks"]');
  container.replaceChildren();

  frameworks.forEach((framework) => {
    const item = document.createElement('article');
    item.className = 'resource-item';
    const name = document.createElement('strong');
    name.textContent = framework.name;
    const focus = document.createElement('span');
    focus.textContent = framework.focus;
    const contribution = document.createElement('p');
    contribution.textContent = framework.contribution;
    const link = document.createElement('a');
    link.href = framework.repositoryUrl;
    link.target = '_blank';
    link.rel = 'noreferrer';
    link.innerHTML = 'Repository <i class="button-icon" data-lucide="external-link" aria-hidden="true"></i>';
    item.append(name, focus, contribution, link);
    container.appendChild(item);
  });
}

function renderBenchmarks(benchmarks) {
  const container = document.querySelector('[data-resource-list="benchmarks"]');
  container.replaceChildren();

  benchmarks.forEach((benchmark) => {
    const item = document.createElement('article');
    item.className = 'resource-item';
    const name = document.createElement('strong');
    name.textContent = benchmark.name;
    const domain = document.createElement('span');
    domain.textContent = benchmark.domain;
    const use = document.createElement('p');
    use.textContent = benchmark.use;
    const scale = document.createElement('b');
    scale.textContent = benchmark.scale;
    const link = document.createElement('a');
    link.href = benchmark.repositoryUrl;
    link.target = '_blank';
    link.rel = 'noreferrer';
    link.innerHTML = 'Open benchmark <i class="button-icon" data-lucide="external-link" aria-hidden="true"></i>';
    item.append(name, domain, use, scale, link);
    container.appendChild(item);
  });
}

function renderTimeline(entries) {
  const container = document.querySelector('#timeline-list');
  container.replaceChildren();

  entries.forEach((entry) => {
    const item = document.createElement('article');
    item.dataset.type = entry.type;
    const date = document.createElement('small');
    date.textContent = entry.date;
    const name = document.createElement('strong');
    name.textContent = entry.name;
    const description = document.createElement('p');
    const typeLabel = entry.type === 'milestone' ? 'Field milestone' : entry.type === 'architecture' ? 'Architectural improvement' : 'Method application';
    description.textContent = typeLabel + (entry.openSource ? ' · Open source' : '');
    item.append(date, name, description);
    container.appendChild(item);
  });
}

function renderClaims(claims) {
  const byId = new Map(claims.map((claim) => [claim.id, claim]));
  document.querySelectorAll('[data-claim-value]').forEach((element) => {
    const claim = byId.get(element.dataset.claimValue);
    if (claim) {
      element.textContent = claim.value;
    }
  });
  document.querySelectorAll('[data-claim-label]').forEach((element) => {
    const claim = byId.get(element.dataset.claimLabel);
    if (claim) element.textContent = claim.label;
  });
}

function showDataError(error) {
  document.querySelectorAll('.data-status').forEach((element) => {
    element.textContent = 'Some data could not be loaded. Please refresh the page.';
  });
  console.error(error);
}

function renderPapers(sourcePapers) {
  const papers = [...sourcePapers].sort((a, b) => (Number(b.year) || 0) - (Number(a.year) || 0) || a.title.localeCompare(b.title));
  const grid = document.querySelector('#paper-grid');
  const count = document.querySelector('#paper-count');
  const pagination = document.querySelector('#paper-pagination');
  const previous = document.querySelector('#paper-prev');
  const next = document.querySelector('#paper-next');
  const pageLabel = document.querySelector('#paper-page');
  const search = document.querySelector('#paper-search');
  const yearFrom = document.querySelector('#paper-year-from');
  const yearTo = document.querySelector('#paper-year-to');
  const includeTagsContainer = document.querySelector('#paper-include-tags');
  const excludeTagsContainer = document.querySelector('#paper-exclude-tags');
  const pageSize = 6;
  let page = 1;
  const corePapers = papers;
  const layerNames = ['Population & archives', 'Parent selection', 'Candidate generation', 'Foundation models', 'Evaluation & feedback', 'Population update', 'Exploration–exploitation'];
  const layerMatchers = {
    'Population & archives': ['ch3'],
    'Candidate generation': ['ch4'],
    'Foundation models': ['ch5'],
    'Evaluation & feedback': ['ch6'],
    'Population update': [],
    'Exploration–exploitation': ['ch7'],
    'Parent selection': ['parentSelection']
  };
  const stepTags = (paper) => {
    const mechanism = paper.mechanism || {};
    const recordedTags = Array.isArray(paper.tags)
      ? paper.tags
      : layerNames.filter((name) => layerMatchers[name].some((key) => (paper.surveyPlacement?.chapters?.[key] || []).length));
    const replacement = String(mechanism.replacement || '').trim();
    if (replacement && !['incremental_insertion', 'unclear', 'none', 'none_clear'].includes(replacement) && !recordedTags.includes('Population update')) {
      recordedTags.push('Population update');
    }
    const tags = layerNames.filter((name) => recordedTags.includes(name));
    return tags.filter((tag) => {
      if (tag === 'Foundation models' && mechanism.modelSetting === 'single_model') return false;
      if (tag === 'Evaluation & feedback' && mechanism.evaluation === 'scalar_objective') return false;
      if (tag === 'Exploration–exploitation' && mechanism.explorationExploitation === 'implicit') return false;
      return true;
    });
  };
  const paperTags = (paper) => stepTags(paper).map((tag) => {
    const chip = document.createElement('span');
    chip.textContent = tag;
    chip.className = 'paper-tag';
    return chip;
  });
  function renderTagFilters(container, prefix) {
    layerNames.forEach((value, index) => {
      const label = document.createElement('label');
      label.className = 'paper-filter-option';
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.value = value;
      input.id = `${prefix}-tag-${index}`;
      const text = document.createElement('span');
      text.textContent = value;
      label.append(input, text);
      container.append(label);
    });
  }
  renderTagFilters(includeTagsContainer, 'include');
  renderTagFilters(excludeTagsContainer, 'exclude');

  function renderTags(card, paper) {
    const tags = document.createElement('div');
    tags.className = 'paper-tags';
    paperTags(paper).forEach((tag) => tags.append(tag));
    if (!tags.childElementCount) {
      tags.classList.add('paper-tags-empty');
      tags.textContent = 'No system tags recorded';
    }
    card.append(tags);
  };
  const years = [...new Set(papers.map((paper) => paper.year).filter((value) => value !== '—'))].sort((a, b) => b - a);
  if (years.length) {
    const earliest = String(Math.min(...years));
    const latest = String(Math.max(...years));
    yearFrom.min = earliest;
    yearFrom.max = latest;
    yearTo.min = earliest;
    yearTo.max = latest;
  }
  let savedState = null;
  try {
    savedState = JSON.parse(window.sessionStorage.getItem('paperExplorerState') || 'null');
  } catch (error) {
    savedState = null;
  }
  if (savedState) {
    search.value = savedState.search || '';
    yearFrom.value = savedState.yearFrom || '';
    yearTo.value = savedState.yearTo || '';
    const savedIncludes = Array.isArray(savedState.includeTags) ? savedState.includeTags : [];
    const savedExcludes = Array.isArray(savedState.excludeTags) ? savedState.excludeTags : [];
    includeTagsContainer.querySelectorAll('input').forEach((input) => { input.checked = savedIncludes.includes(input.value); });
    excludeTagsContainer.querySelectorAll('input').forEach((input) => { input.checked = savedExcludes.includes(input.value); });
    page = Number(savedState.page) > 0 ? Number(savedState.page) : 1;
    window.sessionStorage.removeItem('paperExplorerState');
  }

  function draw() {
    const query = search.value.trim().toLowerCase();
    const fromYear = Number.parseInt(yearFrom.value, 10);
    const toYear = Number.parseInt(yearTo.value, 10);
    const includeTags = [...includeTagsContainer.querySelectorAll('input:checked')].map((input) => input.value);
    const excludeTags = [...excludeTagsContainer.querySelectorAll('input:checked')].map((input) => input.value);
    const filtered = corePapers.filter((paper) => {
      const haystack = [paper.title, ...normalizeAuthors(paper.authors), paper.venue, paper.topic, paper.year].join(' ').toLowerCase();
      const tags = stepTags(paper);
      const yearValue = Number(paper.year);
      const yearMatches = (Number.isNaN(fromYear) || yearValue >= fromYear) && (Number.isNaN(toYear) || yearValue <= toYear);
      const includeMatches = includeTags.every((tag) => tags.includes(tag));
      const excludeMatches = excludeTags.every((tag) => !tags.includes(tag));
      return (!query || haystack.includes(query)) && yearMatches && includeMatches && excludeMatches;
    });
    const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
    page = Math.min(page, pages);
    const start = (page - 1) * pageSize;
    const visible = filtered.slice(start, start + pageSize);
    count.textContent = `${filtered.length ? start + 1 : 0}–${Math.min(start + pageSize, filtered.length)} of ${filtered.length} paper records`;
    grid.replaceChildren();
    if (!filtered.length) {
      const empty = document.createElement('p');
      empty.className = 'data-status';
      empty.textContent = 'No paper records match these filters.';
      grid.append(empty);
      pagination.hidden = true;
      return;
    }
    visible.forEach((paper) => {
      const card = document.createElement('a');
      card.className = 'paper-card';
      card.href = `paper.html?key=${encodeURIComponent(paper.key)}&v=task-profile-1`;
      card.addEventListener('click', () => {
        window.sessionStorage.setItem('paperExplorerState', JSON.stringify({
          search: search.value,
          yearFrom: yearFrom.value,
          yearTo: yearTo.value,
          includeTags: [...includeTagsContainer.querySelectorAll('input:checked')].map((input) => input.value),
          excludeTags: [...excludeTagsContainer.querySelectorAll('input:checked')].map((input) => input.value),
          page,
          scrollY: window.scrollY
        }));
      });
      const meta = document.createElement('div');
      meta.className = 'paper-meta';
      const yearLabel = document.createElement('span');
      yearLabel.textContent = paper.year;
      meta.append(yearLabel);
      const title = document.createElement('h3');
      title.textContent = paper.title;
      const author = document.createElement('p');
      author.textContent = formatCardAuthors(paper.authors);
      const venue = document.createElement('small');
      venue.textContent = paper.venue;
      card.append(meta, title, author, venue);
      renderTags(card, paper);
      grid.append(card);
    });
    pagination.hidden = pages === 1;
    pageLabel.textContent = `Page ${page} / ${pages}`;
    previous.disabled = page === 1;
    next.disabled = page === pages;
  }
  [search, yearFrom, yearTo].forEach((control) => control.addEventListener('input', () => { page = 1; draw(); }));
  [...includeTagsContainer.querySelectorAll('input'), ...excludeTagsContainer.querySelectorAll('input')]
    .forEach((control) => control.addEventListener('change', () => { page = 1; draw(); }));
  previous.addEventListener('click', () => { if (page > 1) { page -= 1; draw(); } });
  next.addEventListener('click', () => { page += 1; draw(); });
  draw();
  if (savedState?.scrollY) window.setTimeout(() => window.scrollTo(0, Number(savedState.scrollY)), 0);
}

async function initializeData() {
  try {
    const [site, frameworks, benchmarks, timeline, claims, paperManifest] = await Promise.all([
      fetchJson('data/site.json'),
      fetchJson('data/frameworks.json'),
      fetchJson('data/benchmarks.json'),
      fetchJson('data/timeline.json'),
      fetchJson('data/claims.json'),
      fetchJson('data/papers/index.json')
    ]);
    renderStatistics(site, frameworks, benchmarks);
    renderFrameworks(frameworks);
    renderBenchmarks(benchmarks);
    renderTimeline(timeline);
    renderClaims(claims);
    refreshIcons();
    loadPapersWhenVisible(paperManifest.records || []);
    updateProgress();
  } catch (error) {
    showDataError(error);
  }
}

initializeData();
