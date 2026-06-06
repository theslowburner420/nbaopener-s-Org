import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hoopscollector.app',
  appName: 'Hoops Collector',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      clientId: '103038526514-h2r91joiaeptjf39nc7lu475t3dqon70.apps.googleusercontent.com',
      serverClientId: '103038526514-h2r91joiaeptjf39nc7lu475t3dqon70.apps.googleusercontent.com',
      androidClientId: '103038526514-ellajc3plr8b81pijulasgpn9tli104f.apps.googleusercontent.com',
      forceCodeForRefreshToken: true
    }
  }
};

export default config;
