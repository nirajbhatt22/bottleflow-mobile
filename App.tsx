import React from 'react';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/inter';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { CartProvider } from './src/context/CartContext';
import { OrderProvider } from './src/context/OrderContext';
import { SessionProvider } from './src/context/SessionContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { navigationTheme } from './src/theme/theme';

// START HERE: this file loads the fonts, app memory and screen navigation.
export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <SessionProvider>
        <CartProvider>
          <OrderProvider>
            <NavigationContainer theme={navigationTheme}>
              <StatusBar style="dark" />
              <AppNavigator />
            </NavigationContainer>
          </OrderProvider>
        </CartProvider>
      </SessionProvider>
    </SafeAreaProvider>
  );
}
