const root = document.querySelector('.rendering-note');
if (root) {
  const stage = root.querySelector('.rendering-stage');
  const status = root.querySelector('.rendering-status');
  const buttons = [...root.querySelectorAll('[data-render-mode]')];
  let active, generation = 0, visible = false;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const theme = () => {const s = getComputedStyle(root);return {bg:s.getPropertyValue('--surface').trim(), ink:s.getPropertyValue('--ink').trim(), accent:s.getPropertyValue('--accent').trim(), line:s.getPropertyValue('--line').trim()};};
  const redraw = () => {if(active && visible && !document.hidden) active.draw(theme());};
  async function select(mode) {
    const ticket = ++generation;
    active?.dispose(); active = null;
    stage.querySelector('canvas')?.remove(); delete stage.dataset.ready; delete stage.dataset.backend;
    buttons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.renderMode === mode)));
    status.textContent = mode === 'map' ? '' : '正在准备视图…';
    const canvas = document.createElement('canvas');canvas.setAttribute('aria-hidden','true');
    stage.append(canvas);
    try {
      const module = await import(`./${mode}.js`);
      if(ticket !== generation) return;
      const instance = await module.create(canvas, {reducedMotion:reduced.matches});
      if(ticket !== generation) {instance.dispose();return;}
      active = instance; active.resize(stage.clientWidth, stage.clientHeight);
      active.draw(theme()); stage.dataset.ready = 'true'; stage.dataset.backend = active.backend;
      status.textContent = '';
    } catch(error) {
      if(ticket !== generation) return;
      canvas.remove();status.textContent = '此视图暂不可用，可切换到「关联」。';
      stage.dataset.error = error.name || 'Error';
    }
  }
  buttons.forEach(b => b.addEventListener('click', () => select(b.dataset.renderMode)));
  new ResizeObserver(() => {if(active){active.resize(stage.clientWidth, stage.clientHeight);redraw();}}).observe(stage);
  new MutationObserver(redraw).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme','class']});
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change',redraw);
  document.addEventListener('visibilitychange',redraw);
  new IntersectionObserver(entries => {visible=entries[0].isIntersecting;if(visible && !generation) select('map');else redraw();}).observe(stage);
  stage.addEventListener('pointermove', e => {if(!active || reduced.matches || !visible)return;const r=stage.getBoundingClientRect();active.pointer?.((e.clientX-r.left)/r.width-.5,(e.clientY-r.top)/r.height-.5);redraw();});
  stage.addEventListener('pointerleave', () => {active?.pointer?.(0,0);redraw();});
  window.addEventListener('pagehide',()=>active?.dispose(),{once:true});
}
