import { HOTSPOTS, type HotspotId } from './hotspotContent';

export interface UIHandles {
  root: HTMLElement;
  setZone: (name: string) => void;
  setPrompt: (text: string | null) => void;
  setCrosshairHot: (hot: boolean) => void;
  openHotspot: (id: HotspotId) => void;
  closeHotspot: () => void;
  isOverlayOpen: () => boolean;
  setVRButton: (btn: HTMLElement) => void;
  hideDesktopChrome: (hide: boolean) => void;
}

export function createUI(parent: HTMLElement): UIHandles {
  parent.innerHTML = `
    <div class="zone-badge" id="zone-badge">Valle del Cócora</div>
    <div class="crosshair" id="crosshair" aria-hidden="true"></div>
    <div class="prompt" id="interact-prompt" role="status"></div>
    <aside class="hud interactive" id="hud">
      <h1>Valle del Cócora</h1>
      <p>Tour virtual del Eje Cafetero. Explora el valle, entra a la casa típica y descubre el museo.</p>
      <ul>
        <li><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> moverse</li>
        <li>Clic en el canvas para mirar con el ratón</li>
        <li><kbd>E</kbd> interactuar / entrar</li>
        <li><kbd>Esc</kbd> soltar el ratón</li>
      </ul>
    </aside>
    <div id="vr-slot" class="interactive"></div>
    <div id="overlay-slot"></div>
  `;

  const zoneBadge = parent.querySelector('#zone-badge') as HTMLElement;
  const crosshair = parent.querySelector('#crosshair') as HTMLElement;
  const prompt = parent.querySelector('#interact-prompt') as HTMLElement;
  const hud = parent.querySelector('#hud') as HTMLElement;
  const overlaySlot = parent.querySelector('#overlay-slot') as HTMLElement;
  const vrSlot = parent.querySelector('#vr-slot') as HTMLElement;

  let overlayOpen = false;

  const handles: UIHandles = {
    root: parent,
    setZone(name) {
      zoneBadge.textContent = name;
    },
    setPrompt(text) {
      if (!text) {
        prompt.classList.remove('visible');
        prompt.textContent = '';
        return;
      }
      prompt.textContent = text;
      prompt.classList.add('visible');
    },
    setCrosshairHot(hot) {
      crosshair.classList.toggle('hot', hot);
    },
    openHotspot(id) {
      const content = HOTSPOTS[id];
      overlayOpen = true;
      const media = content.videoStub
        ? `<video controls playsinline poster="" aria-label="Video stub">
             <source src="" type="video/mp4" />
             Tu navegador no reproduce el video stub. Coloca un MP4 en public/assets/video/.
           </video>`
        : `<img src="${content.imageSrc ?? ''}" alt="${content.title}" />`;

      overlaySlot.innerHTML = `
        <div class="overlay-backdrop interactive" id="hotspot-overlay" role="dialog" aria-modal="true" aria-labelledby="hotspot-title">
          <div class="overlay-panel">
            <h2 id="hotspot-title">${content.title}</h2>
            ${media}
            <p>${content.body}</p>
            <button type="button" class="overlay-close" id="hotspot-close">Cerrar</button>
          </div>
        </div>
      `;

      const close = () => handles.closeHotspot();
      overlaySlot.querySelector('#hotspot-close')?.addEventListener('click', close);
      overlaySlot.querySelector('#hotspot-overlay')?.addEventListener('click', (e) => {
        if ((e.target as HTMLElement).id === 'hotspot-overlay') close();
      });
    },
    closeHotspot() {
      overlayOpen = false;
      overlaySlot.innerHTML = '';
    },
    isOverlayOpen() {
      return overlayOpen;
    },
    setVRButton(btn) {
      btn.classList.add('vr-btn', 'interactive');
      vrSlot.replaceChildren(btn);
    },
    hideDesktopChrome(hide) {
      hud.style.display = hide ? 'none' : '';
      crosshair.style.display = hide ? 'none' : '';
    },
  };

  return handles;
}
