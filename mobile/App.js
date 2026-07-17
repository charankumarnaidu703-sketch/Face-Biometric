import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';

// Screens
import LoginScreen from './screens/LoginScreen';
import AdminTabNavigator from './screens/AdminTabNavigator';
import FaceEnrollmentScreen from './screens/FaceEnrollmentScreen';
import GuardTabNavigator from './screens/GuardTabNavigator';
import StudentFoundModalScreen from './screens/StudentFoundModalScreen';

// Store
import useStore from './store/useStore';

const Stack = createStackNavigator();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const isInitialized = useStore((s) => s.isInitialized);
  const loadPersistedAuth = useStore((s) => s.loadPersistedAuth);
  const token = useStore((s) => s.token);
  const role = useStore((s) => s.role);

  useEffect(() => {
    // Attempt to restore persisted auth session on app launch
    loadPersistedAuth().then(() => setIsLoading(false));
  }, []);

  // Show splash/loading while restoring session
  if (isLoading || !isInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <StatusBar style="auto" />
      </View>
    );
  }

  // Determine the initial route based on persisted auth
  const getInitialRoute = () => {
    if (!token) return 'Login';
    if (role === 'admin') return 'AdminDashboard';
    if (role === 'guard') return 'GuardScan';
    return 'Login';
  };

  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator
        initialRouteName={getInitialRoute()}
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: '#FAF8FF' },
          animationEnabled: true,
        }}
      >
        {/* Auth Screens */}
        <Stack.Screen name="Login" component={LoginScreen} />

        {/* Admin Screens (Tab navigation for dashboard/register/roster) */}
        <Stack.Screen name="AdminDashboard" component={AdminTabNavigator} />
        <Stack.Screen name="FaceEnrollment" component={FaceEnrollmentScreen} />

        {/* Guard Screens */}
        <Stack.Screen name="GuardScan" component={GuardTabNavigator} />
        <Stack.Screen name="StudentFoundModal" component={StudentFoundModalScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAF8FF',
  },
});
