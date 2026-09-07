import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hoopscollector.app',
  appName: 'Hoops Collector',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
