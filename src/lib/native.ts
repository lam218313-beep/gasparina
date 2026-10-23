/**
 * Lo que solo existe dentro de la app instalada (Capacitor): el botón atrás de Android, la barra de
 * estado y la pantalla de arranque. En la web cada función no hace nada, así las pantallas nunca
 * preguntan dónde corren. Copiado de la app de Partners.
 */
import { Capacitor } from '@capacitor/core';

export const isNative = Capacitor.isNativePlatform();
export const platform = Capacitor.getPlatform(); // 'ios' | 'android' | 'web'

/** Barra de estado oscura, pantalla de arranque oculta y botón atrás = volver. */
export async function startNativeShell(goBack: () => boolean): Promise<void> {
  if (!isNative) return;
  // Cada pieza por su lado: si una falla, las otras (y la app) siguen.
  try {
    const { SplashScreen } = await import('@capacitor/splash-screen');
    await SplashScreen.hide();
  } catch (e) { console.error('[cerebro] splash', e); }
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    await StatusBar.setStyle({ style: Style.Dark });
    if (platform === 'android') await StatusBar.setBackgroundColor({ color: '#0A0A0C' });
  } catch (e) { console.error('[cerebro] barra de estado', e); }
  try {
    const { App } = await import('@capacitor/app');
    await App.addListener('backButton', () => { if (!goBack()) void App.minimizeApp(); });
  } catch (e) { console.error('[cerebro] botón atrás', e); }
}
