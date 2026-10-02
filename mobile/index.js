/**
 * @format
 */

import { AppRegistry, Platform } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

if (Platform.OS === 'android') {
  const ReactNativeForegroundService = require('@supersami/rn-foreground-service').default;
  ReactNativeForegroundService.register();
}

AppRegistry.registerComponent(appName, () => App);
