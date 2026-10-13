const layerId = new URLSearchParams(window.location.search).get('id') || 'population';
const backLinks = document.querySelectorAll('.layer-back-link');

async function renderLayer() {
  const response = await fetch('data/layers.json?v=system-map-9');
  if (!response.ok) throw new Error('Layer content could not be loaded.');
  const layers = await response.json();
  const layer = layers[layerId];
  if (!layer) throw new Error('This system layer does not exist.');

  document.title = `${layer.title} · Awesome LLM-ES`;
  document.querySelector('meta[name="description"]').content = layer.lead;
  document.querySelector('#layer-number').textContent = layer.number;
  document.querySelector('#layer-kicker').textContent = layer.kicker;
  document.querySelector('#layer-lead').textContent = layer.lead;
  document.querySelector('#layer-note-title').textContent = layer.noteTitle;
  document.querySelector('#layer-note-copy').textContent = layer.noteCopy;

  const title = document.querySelector('#layer-title');
  title.replaceChildren(document.createTextNode(layer.titleMain));
  if (layer.titleAccent) {
    const accent = document.createElement('span');
    accent.textContent = ` ${layer.titleAccent}`;
    title.append(accent);
  }

  const taxonomy = document.querySelector('#layer-taxonomy');
  taxonomy.setAttribute('aria-label', `${layer.title} design dimensions`);
  taxonomy.replaceChildren(...layer.dimensions.map((dimension, index) => {
    const axis = document.createElement('section');
    axis.className = 'layer-axis';

    const heading = document.createElement('div');
    heading.className = 'layer-axis-heading';
    const number = document.createElement('span');
    number.textContent = String(index + 1).padStart(2, '0');
    const headingCopy = document.createElement('div');
    const headingTitle = document.createElement('h2');
    headingTitle.textContent = dimension.title;
    const question = document.createElement('p');
    question.textContent = dimension.question;
    headingCopy.append(headingTitle, question);
    heading.append(number, headingCopy);

    const options = document.createElement('ol');
    options.className = `layer-options${dimension.optionLayout === 'columns' ? ' layer-options-columns' : ''}`;
    dimension.options.forEach((option) => {
      const item = document.createElement('li');
      const optionTitle = document.createElement('strong');
      optionTitle.textContent = option.name;
      const description = document.createElement('p');
      description.textContent = option.description;
      item.append(optionTitle, description);
      options.append(item);
    });

    const note = document.createElement('p');
    note.className = 'layer-axis-note';
    note.textContent = dimension.note;
    axis.append(heading, options, note);
    return axis;
  }));

  const flow = document.querySelector('#layer-flow');
  flow.replaceChildren();
  layer.flow.forEach((label, index) => {
    const item = document.createElement('div');
    const number = document.createElement('span');
    number.textContent = String(index + 1).padStart(2, '0');
    const text = document.createElement('strong');
    text.textContent = label;
    item.append(number, text);
    flow.append(item);
    if (index < layer.flow.length - 1) {
      const arrow = document.createElement('i');
      arrow.setAttribute('data-lucide', 'arrow-right');
      arrow.setAttribute('aria-hidden', 'true');
      flow.append(arrow);
    }
  });

  if (layer.flowNote) {
    const note = document.createElement('p');
    note.className = 'layer-flow-note';
    note.textContent = layer.flowNote;
    flow.after(note);
  }

  backLinks.forEach((link) => {
    link.addEventListener('click', () => {
      try {
        if (!window.sessionStorage.getItem('layerMapReturn')) {
          window.sessionStorage.setItem('layerMapReturn', JSON.stringify({ number: layer.number, scrollY: 0 }));
        }
      } catch (error) {
        window.sessionStorage.setItem('layerMapReturn', JSON.stringify({ number: layer.number, scrollY: 0 }));
      }
    });
  });

  if (window.lucide) window.lucide.createIcons({ attrs: { 'stroke-width': 2.35 } });
}

renderLayer().catch((error) => {
  const heading = document.querySelector('.layer-detail-heading');
  heading.replaceChildren(Object.assign(document.createElement('p'), {
    className: 'layer-error',
    textContent: error.message
  }));
});
