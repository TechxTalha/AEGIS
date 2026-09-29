/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import ReactNativeForegroundService from '@supersami/rn-foreground-service';
import { name as appName } from './app.json';

ReactNativeForegroundService.register();

AppRegistry.registerComponent(appName, () => App);
