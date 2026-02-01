import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.jully.lembreme',
  appName: 'lembre-me',
  webDir: 'www',
  plugins:{
    StatusBar: {
      overlaysWebView: false,
      style: "DARK",
    },
  }
};

export default config;
