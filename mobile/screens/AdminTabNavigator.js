import React from 'react';
import { StyleSheet, Text, View, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// Screens
import AdminDashboardScreen from './AdminDashboardScreen';
import StudentListScreen from './StudentListScreen';
import RegisterStudentScreen from './RegisterStudentScreen';

const Tab = createBottomTabNavigator();

export default function AdminTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#737686',
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarIcon: ({ color, focused }) => {
          let icon = '❓';
          if (route.name === 'AdminHome') {
            icon = focused ? '🏠' : '🏠';
          } else if (route.name === 'StudentList') {
            icon = focused ? '👥' : '👥';
          } else if (route.name === 'RegisterStudent') {
            icon = focused ? '➕' : '➕';
          }

          return (
            <View style={focused ? styles.iconActiveContainer : styles.iconInactiveContainer}>
              <Text style={[styles.iconText, { color }]}>{icon}</Text>
            </View>
          );
        },
      })}
    >
      <Tab.Screen
        name="AdminHome"
        component={AdminDashboardScreen}
        options={{
          tabBarLabel: 'Dash',
        }}
      />
      <Tab.Screen
        name="RegisterStudent"
        component={RegisterStudentScreen}
        options={{
          tabBarLabel: 'Reg',
        }}
      />
      <Tab.Screen
        name="StudentList"
        component={StudentListScreen}
        options={{
          tabBarLabel: 'Roster',
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: Platform.OS === 'ios' ? 88 : 72,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderColor: '#E7E7F3',
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    paddingTop: 10,
    shadowColor: '#191B23',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 4,
  },
  tabBarLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  iconActiveContainer: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
  },
  iconInactiveContainer: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  iconText: {
    fontSize: 18,
  },
});
