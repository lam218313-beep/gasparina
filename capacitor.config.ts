import type { CapacitorConfig } from '@capacitor/cli';

// La app instalada envuelve la misma compilación web (dist/).
const config: CapacitorConfig = {
  appId: 'pe.lama.cerebro',
  appName: 'Gasparina',
  webDir: 'dist',
  backgroundColor: '#0A0A0C',
  // https en el WebView: cookies y almacenamiento se comportan como en la web.
  server: { androidScheme: 'https' },
  android: { allowMixedContent: false },
  plugins: {
    // Se oculta sola: la primera pantalla nunca depende de una llamada nativa.
    SplashScreen: { launchAutoHide: true, launchShowDuration: 600, backgroundColor: '#0A0A0C', showSpinner: false },
    StatusBar: { style: 'DARK', backgroundColor: '#0A0A0C', overlaysWebView: false },
  },
};

export default config;
