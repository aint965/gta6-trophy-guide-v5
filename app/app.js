const STORE_KEY = 'leonida-ledger-progress-v1';
const rows = document.getElementById('rows');
const detail = document.getElementById('detail');
const filters = [...document.querySelectorAll('.filter')];
const sourceBook = 'PowerPyx · GTA 6 Trophy Guide & Roadmap';

let progress = readProgress();
let trophies = [];
let activeFilter = 'all';
let selectedId = 14;
let query = '';
let toastTimer = 0;

const stageContent = [
  {id:1,kicker:'KEEP THE FIRST CHAPTER IN VIEW',title:'Story + one caution',summary:'Play the story naturally. Before the Chapter 1 curtain falls, do Lucia’s optional balcony meditation as insurance.',duration:'60–80 HRS',ids:[2,3,4,5,6,7,8,9,10,11,12,13,28]},
  {id:2,kicker:'OPEN-WORLD SWEEP',title:'Unlock the 100% checklist',summary:'After the story, work toward A Long Road. Your story-time scanning and activities already count.',duration:'~100 HRS',ids:[14,15,16,17,18,19,21,30,31,32,33,34,35,36,37,38,39,40,41,42,43]},
  {id:3,kicker:'SIDE LINES + FREE ROAM',title:'Close out the strands',summary:'Finish the qualifying stranger chains, character questlines and remaining one-off activities.',duration:'~10 HRS',ids:[20,22,23,24,25,26,27,29,44,45,46,47,48,49,50,51,52,53,54,55]},
  {id:4,kicker:'THE FINAL CHECK',title:'Claim the platinum',summary:'Review any remaining checklist items, confirm every trophy is earned, then let the platinum arrive.',duration:'CAPSTONE',ids:[1]}
];

function readProgress() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORE_KEY) ?? '{}');
    return {earned:Array.isArray(parsed.earned) ? parsed.earned : [], notes:parsed.notes && typeof parsed.notes === 'object' ? parsed.notes : {}, spoilers:parsed.spoilers !== false};
  } catch { return {earned:[],notes:{},spoilers:true}; }
}

function saveProgress() {
  localStorage.setItem(STORE_KEY, JSON.stringify(progress));
}

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2300);
}

function htmlEscape(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}

function earned(trophy) { return progress.earned.includes(trophy.name); }

function masked(trophy) {
  return progress.spoilers && trophy.story && !earned(trophy);
}

function visibleTrophies() {
  const term = query.trim().toLocaleLowerCase();
  return trophies.filter((trophy) => {
    const filterMatch = activeFilter === 'all' || (activeFilter === 'story' ? trophy.story : activeFilter === 'missable' ? trophy.verdict === 'missable' : activeFilter === 'online' ? false : trophy.tags.includes(activeFilter));
    if (!filterMatch) return false;
    if (!term) return true;
    if (masked(trophy)) return 'story milestone hidden'.includes(term);
    return `${trophy.name} ${trophy.description} ${trophy.guide} ${trophy.verdict} ${trophy.tags.join(' ')}`.toLocaleLowerCase().includes(term);
  });
}

function progressSummary() {
  const count = progress.earned.length;
  document.getElementById('progress').innerHTML = `${count} <i>/ 55</i>`;
  document.getElementById('earned-count').textContent = `${count} earned`;
  document.getElementById('progress-percent').textContent = `${Math.round(count / 55 * 100)}% complete`;
  document.getElementById('progress-fill').style.width = `${count / 55 * 100}%`;
  const grades = ['platinum','gold','silver','bronze'];
  document.getElementById('grade-counts').innerHTML = grades.map((grade) => `<span><b>${trophies.filter((item) => item.grade === grade).length}</b> ${grade}</span>`).join('');
}

function renderList() {
  const visible = visibleTrophies();
  if (!visible.some((trophy) => trophy.id === selectedId)) selectedId = visible[0]?.id ?? null;
  document.getElementById('visible-count').textContent = `${visible.length} ${visible.length === 1 ? 'entry' : 'entries'}`;
  document.getElementById('empty-list').hidden = visible.length !== 0;
  rows.replaceChildren();
  visible.forEach((trophy) => {
    const isEarned = earned(trophy);
    const isMasked = masked(trophy);
    const card = document.createElement('article');
    card.className = `trophy-card${selectedId === trophy.id ? ' selected' : ''}${isEarned ? ' earned' : ''}`;
    card.dataset.id = String(trophy.id);
    card.tabIndex = 0;
    card.setAttribute('aria-label', `${isMasked ? 'Story trophy hidden' : trophy.name}, ${trophy.grade}, ${trophy.verdict}`);
    card.innerHTML = `<span class="check-wrap"><input class="earned-check" type="checkbox" aria-label="Mark ${isMasked ? 'hidden story milestone' : htmlEscape(trophy.name)} earned" ${isEarned ? 'checked' : ''}></span><span class="trophy-main"><span class="trophy-name">${isMasked ? 'Story milestone hidden' : htmlEscape(trophy.name)}</span><span class="trophy-description">${isMasked ? 'Earn this entry to reveal its official details.' : htmlEscape(trophy.description)}</span></span><span class="trophy-meta"><span class="grade ${htmlEscape(trophy.grade)}">${htmlEscape(trophy.grade)}</span>${trophy.verdict === 'missable' ? '<span class="status-tag missable">⚑ Missable?</span>' : trophy.verdict === 'chapter-locked' ? '<span class="status-tag">Chapter</span>' : trophy.verdict === 'questline' ? '<span class="status-tag">Questline</span>' : '<span class="status-tag">Safe</span>'}</span>`;
    card.addEventListener('click', (event) => {
      if (event.target.closest('input')) return;
      selectedId = trophy.id;
      renderList();
      renderDetail();
    });
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        if (event.target === card) { event.preventDefault(); selectedId = trophy.id; renderList(); renderDetail(); }
      }
    });
    card.querySelector('.earned-check').addEventListener('change', (event) => {
      const set = new Set(progress.earned);
      if (event.currentTarget.checked) set.add(trophy.name); else set.delete(trophy.name);
      progress.earned = [...set];
      saveProgress();
      progressSummary();
      updateNextUp();
      renderList();
      renderDetail();
      const name = masked(trophy) ? 'Story milestone hidden' : trophy.name;
      showToast(event.currentTarget.checked ? `${name} logged as earned.` : `${name} returned to your list.`);
    });
    rows.append(card);
  });
}

function renderDetail() {
  const trophy = trophies.find((item) => item.id === selectedId);
  if (!trophy) { detail.innerHTML = '<div class="detail-inner"><div class="detail-title">No trophy selected</div><p class="guide-copy">Choose a different filter to return to the guide.</p></div>'; return; }
  const isEarned = earned(trophy);
  const isMasked = masked(trophy);
  const sources = trophy.sources.map((source) => `<a href="${htmlEscape(source.url)}" target="_blank" rel="noreferrer">${htmlEscape(source.label)} ↗</a>`).join('<br>');
  const title = isMasked ? 'Story milestone hidden' : htmlEscape(trophy.name);
  const description = isMasked ? 'Hidden by your spoiler preference. Earn this trophy to reveal its official PlayStation description.' : htmlEscape(trophy.description);
  const guide = isMasked ? 'This entry is part of the main story. Keep progressing, and its name and details will appear when it is earned.' : htmlEscape(trophy.guide);
  const verdict = trophy.verdict === 'missable' ? 'POTENTIALLY MISSABLE' : trophy.verdict.toUpperCase();
  detail.innerHTML = `<div class="detail-inner"><div class="detail-overline"><span>FIELD NOTE <b>${String(trophy.id).padStart(2,'0')}</b> / 55</span><span class="detail-number">${isEarned ? '✓ LOGGED' : 'LL · 2026'}</span></div><h2 class="detail-title">${title}</h2><p class="detail-official">${description}</p><div class="detail-tags"><span class="pill ${trophy.grade === 'gold' || trophy.grade === 'platinum' ? '' : ''}">${htmlEscape(trophy.grade)}</span><span class="pill ${trophy.verdict === 'missable' ? 'alert' : ''}">${verdict}</span>${trophy.story ? '<span class="pill">STORY</span>' : ''}</div><div class="detail-section-label">HOW TO GET IT · ${isEarned ? 'COMPLETE' : 'GUIDE'}</div><p class="guide-copy">${guide}</p><div class="source-line"><span class="source-icon">↗</span><span><b>SOURCE CHECKED</b><br>${sources}</span></div><div class="notes-label"><label for="trophy-note">YOUR FIELD NOTES</label><span>SAVED ON THIS DEVICE</span></div><textarea id="trophy-note" class="note-input" maxlength="500" placeholder="Route, reminder, or progress note…">${htmlEscape(progress.notes[trophy.name] ?? '')}</textarea></div>`;
  detail.querySelector('#trophy-note').addEventListener('input', (event) => {
    const value = event.currentTarget.value;
    if (value) progress.notes[trophy.name] = value; else delete progress.notes[trophy.name];
    saveProgress();
  });
}

function updateNextUp() {
  const next = trophies.find((trophy) => !earned(trophy));
  const copy = document.getElementById('next-up');
  const button = document.getElementById('next-button');
  if (!next) { copy.textContent = 'Every trophy is logged. The Leonida Legend is yours.'; button.textContent = 'Platinum complete ✓'; button.disabled = true; return; }
  copy.textContent = masked(next) ? 'Story milestone hidden · follow the story.' : next.id === 28 ? 'Do Lucia’s Chapter 1 balcony meditation if you are still there; the source says whether it is required remains unconfirmed.' : `${next.name} · ${next.verdict === 'chapter-locked' ? 'follow the story' : next.verdict === 'questline' ? 'work the questline' : next.verdict === 'missable' ? 'check the early-game caution' : 'ready for cleanup'}.`;
  button.innerHTML = 'Open guide <span>→</span>';
  button.disabled = false;
  button.onclick = () => openTrophy(next.id);
}

function renderRoadmap() {
  document.getElementById('roadmap-stages').innerHTML = stageContent.map((stage) => {
    const visibleIds = stage.ids;
    const earnedCount = visibleIds.filter((id) => { const item = trophies.find((t) => t.id === id); return item && earned(item); }).length;
    const all = visibleIds.map((id) => trophies.find((t) => t.id === id)).filter(Boolean);
    return `<article class="roadmap-stage"><div class="stage-heading"><div class="stage-number">0${stage.id}</div><div><span class="eyebrow">${stage.kicker}</span><h3>${stage.title}</h3><p>${stage.summary}</p></div><span class="stage-duration">${earnedCount}/${all.length}<br>${stage.duration}</span></div><div class="stage-trophies">${all.map((trophy) => `<div class="stage-row"><span class="small-state">${earned(trophy) ? '✓' : String(trophy.id).padStart(2,'0')}</span><button type="button" data-open-trophy="${trophy.id}">${masked(trophy) ? 'Story milestone hidden' : htmlEscape(trophy.name)}</button><span class="grade ${htmlEscape(trophy.grade)}">${htmlEscape(trophy.grade)}</span></div>`).join('')}</div></article>`;
  }).join('');
  document.getElementById('roadmap-stages').querySelectorAll('[data-open-trophy]').forEach((button) => button.addEventListener('click', () => openTrophy(Number(button.dataset.openTrophy))));
}

function openTrophy(id) {
  selectedId = id;
  document.querySelector('[data-view="guide"]').click();
  activeFilter = 'all';
  filters.forEach((button) => button.classList.toggle('active', button.dataset.filter === 'all'));
  document.getElementById('search').value = '';
  query = '';
  renderList();
  renderDetail();
}

function setView(view) {
  const guide = view === 'guide';
  document.getElementById('guide-view').hidden = !guide;
  document.getElementById('roadmap-view').hidden = guide;
  document.querySelectorAll('.view-tab').forEach((button) => button.classList.toggle('active', button.dataset.view === view));
  if (!guide) renderRoadmap();
}

async function importProgress(file) {
  const data = JSON.parse(await file.text());
  const names = Array.isArray(data) ? data : data.earned;
  if (!Array.isArray(names) || names.some((name) => typeof name !== 'string')) throw new Error('Save must contain an earned trophy-name list.');
  const known = new Set(trophies.map((trophy) => trophy.name));
  progress.earned = [...new Set(names.filter((name) => known.has(name)))];
  if (!Array.isArray(data) && data.notes && typeof data.notes === 'object') progress.notes = data.notes;
  if (!Array.isArray(data) && typeof data.spoilers === 'boolean') progress.spoilers = data.spoilers;
  saveProgress();
  document.getElementById('spoilers').checked = progress.spoilers;
  progressSummary();
  updateNextUp();
  renderList();
  renderDetail();
  showToast(`Imported ${progress.earned.length} trophy${progress.earned.length === 1 ? '' : 'ies'}.`);
}

function exportProgress() {
  const payload = JSON.stringify({format:'leonida-ledger/v1',game:'Grand Theft Auto VI',earned:progress.earned,notes:progress.notes,spoilers:progress.spoilers}, null, 2);
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([payload], {type:'application/json'}));
  link.download = 'leonida-ledger-progress.json';
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1500);
  showToast('Progress exported as a local save file.');
}

document.querySelectorAll('.view-tab').forEach((button) => button.addEventListener('click', () => setView(button.dataset.view)));
filters.forEach((button) => button.addEventListener('click', () => {
  activeFilter = button.dataset.filter;
  filters.forEach((item) => item.classList.toggle('active', item === button));
  renderList();
  renderDetail();
}));
document.getElementById('search').addEventListener('input', (event) => { query = event.currentTarget.value; renderList(); renderDetail(); });
document.getElementById('spoilers').addEventListener('change', (event) => { progress.spoilers = event.currentTarget.checked; saveProgress(); updateNextUp(); renderList(); renderDetail(); showToast(progress.spoilers ? 'Story spoilers are hidden until earned.' : 'Story trophy details are visible.'); });
document.getElementById('export').addEventListener('click', exportProgress);
document.getElementById('import-file').addEventListener('change', async (event) => {
  const input = event.currentTarget;
  const [file] = input.files;
  if (!file) return;
  try { await importProgress(file); } catch (error) { showToast(error instanceof Error ? error.message : 'That save file could not be imported.'); }
  input.value = '';
});
document.getElementById('search').addEventListener('keydown', (event) => { if (event.key === 'Escape') { event.currentTarget.value = ''; query = ''; renderList(); renderDetail(); } });
document.getElementById('next-button').addEventListener('click', () => { const next = trophies.find((trophy) => !earned(trophy)); if (next) openTrophy(next.id); });
document.querySelectorAll('[data-open-trophy]').forEach((button) => button.addEventListener('click', () => openTrophy(Number(button.dataset.openTrophy))));
document.addEventListener('keydown', (event) => { if (event.key === '/' && !['INPUT','TEXTAREA'].includes(document.activeElement.tagName)) { event.preventDefault(); document.getElementById('search').focus(); } });

const documentData = await (await fetch('data/trophies.json')).json();
trophies = documentData.trophies;
document.getElementById('spoilers').checked = progress.spoilers;
document.getElementById('roadmap-tab').addEventListener('click', () => setView('roadmap'));
progressSummary();
updateNextUp();
renderList();
renderDetail();
document.body.dataset.ready = 'true';
