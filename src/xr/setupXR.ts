import * as THREE from 'three';
import type { UIHandles } from '../ui/hud';

/**
 * Configura WebXRManager de Three.js y el botón «Entrar en VR».
 */
export async function setupXR(
  renderer: THREE.WebGLRenderer,
  ui: UIHandles,
): Promise<{ supported: boolean }> {
  renderer.xr.enabled = true;
  renderer.xr.setReferenceSpaceType('local-floor');

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.textContent = 'Entrar en VR';
  btn.disabled = true;
  ui.setVRButton(btn);

  if (!navigator.xr) {
    btn.textContent = 'VR no disponible';
    btn.title = 'Este navegador no expone WebXR. Prueba en Meta Quest Browser.';
    return { supported: false };
  }

  let supported = false;
  try {
    supported = await navigator.xr.isSessionSupported('immersive-vr');
  } catch {
    supported = false;
  }

  if (!supported) {
    btn.textContent = 'VR no compatible';
    btn.title = 'No hay sesión immersive-vr. En Quest Browser debería funcionar.';
    return { supported: false };
  }

  btn.disabled = false;
  btn.textContent = 'Entrar en VR';

  let currentSession: XRSession | null = null;

  const onSessionEnd = () => {
    currentSession = null;
    btn.textContent = 'Entrar en VR';
    ui.hideDesktopChrome(false);
  };

  btn.addEventListener('click', async () => {
    if (currentSession) {
      await currentSession.end();
      return;
    }

    const sessionInit: XRSessionInit = {
      optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking', 'layers'],
    };

    try {
      const session = await navigator.xr!.requestSession('immersive-vr', sessionInit);
      currentSession = session;
      session.addEventListener('end', onSessionEnd);
      await renderer.xr.setSession(session);
      btn.textContent = 'Salir de VR';
      ui.hideDesktopChrome(true);
    } catch (err) {
      console.warn('No se pudo iniciar WebXR:', err);
      btn.textContent = 'Error al entrar en VR';
      setTimeout(() => {
        btn.textContent = 'Entrar en VR';
      }, 2000);
    }
  });

  return { supported: true };
}
