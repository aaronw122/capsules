/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import { NewAppScreen } from '@react-native/new-app-screen';
import { StatusBar, StyleSheet, useColorScheme, View } from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { GameProvider } from './app/context/gameContext';
import { ARProvider } from './app/context/arContext';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Onboarding from './app/Sheets/index';
import Call from './app/Sheets/call';
import { Login } from './app/Sheets/login';
import ARScreen from './app/Sheets/ar';
import { RootStackParamList } from './app/types';
import { Leaderboard } from './app/Sheets/leaderboard';
<<<<<<< HEAD
=======
import { ARProvider } from './app/context/arContext';
>>>>>>> 752a813 ( fixes for hud)

const Stack = createNativeStackNavigator<RootStackParamList>();

//logic for which screens to show
// state = gameOver, show leaderboard
// state = lobby OR playing, show ar.tsx
// state = null,

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <GameProvider>
        <ARProvider>
          <NavigationContainer>
            <Stack.Navigator
              screenOptions={{
                headerTitle: '',
                headerStyle: { backgroundColor: '#0a0a1a' },
                headerShadowVisible: false,
                headerTintColor: '#00f0ff',
                headerBackTitle: 'Back',
                contentStyle: { backgroundColor: '#0a0a1a' },
              }}
            >
              <Stack.Screen name="Onboarding" component={Onboarding} />
              <Stack.Screen name="Call" component={Call} />
              <Stack.Screen name="Login" component={Login} />
              <Stack.Screen name="AR" component={ARScreen} />
              <Stack.Screen name="LeaderBoard" component={Leaderboard} />
            </Stack.Navigator>
          </NavigationContainer>
        </ARProvider>
      </GameProvider>
    </SafeAreaProvider>
  );
}

export default App;
