import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import PatientsScreen from '../screens/PatientsScreen';
import ScheduleScreen from '../screens/ScheduleScreen';
import ProfileScreen from '../screens/ProfileScreen';
import PatientDetailScreen from '../screens/PatientDetailScreen';
import CarePlanScreen from '../screens/CarePlanScreen';
import COLORS from '../constants/colors';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TabBarIcon = ({ name, color, focused }) => (
  <View style={[styles.tabIconWrapper, focused && styles.tabIconActive]}>
    <Ionicons name={name} size={22} color={color} />
  </View>
);

const MainTabs = () => {
  const insets = useSafeAreaInsets();
  const androidBottomInset = Platform.OS === 'android' ? insets.bottom : 0;

  return (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarStyle: [
        styles.tabBar,
        Platform.OS === 'android' && {
          height: 62 + androidBottomInset,
          paddingBottom: 8 + androidBottomInset,
        },
      ],
      tabBarActiveTintColor: COLORS.primary,
      tabBarInactiveTintColor: COLORS.grayText,
      tabBarLabelStyle: styles.tabLabel,
      tabBarIcon: ({ color, focused }) => {
        let iconName;
        if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
        else if (route.name === 'Patients') iconName = focused ? 'people' : 'people-outline';
        else if (route.name === 'Schedule') iconName = focused ? 'calendar' : 'calendar-outline';
        else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
        return <TabBarIcon name={iconName} color={color} focused={focused} />;
      },
    })}
  >
    <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Dashboard' }} />
    <Tab.Screen name="Patients" component={PatientsScreen} options={{ title: 'Patients' }} />
    <Tab.Screen name="Schedule" component={ScheduleScreen} options={{ title: 'Schedule' }} />
    <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
  </Tab.Navigator>
  );
};

const AppNavigator = () => {
  const { nurse } = useAuth();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {nurse ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="PatientDetail" component={PatientDetailScreen} />
            <Stack.Screen name="CarePlan" component={CarePlanScreen} />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    height: 72,
    paddingBottom: 10,
    paddingTop: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 10,
  },
  tabLabel: {
    fontSize: 11,
    fontFamily: 'Outfit-Bold', fontWeight: '700',
    marginTop: 2,
  },
  tabIconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  tabIconActive: {
    backgroundColor: COLORS.lightGreen,
  },
});

export default AppNavigator;
