import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useTranslation } from '../hooks/useTranslation';

// Import screens (to be created)
import HomeScreen from '../screens/citizen/HomeScreen';
import ReportIssueScreen from '../screens/citizen/ReportIssueScreen';
import MyIssuesScreen from '../screens/citizen/MyIssuesScreen';
import ProfileScreen from '../screens/citizen/ProfileScreen';
import IssueDetailScreen from '../screens/citizen/IssueDetailScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Stack navigator for each tab
const HomeStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Home" component={HomeScreen} />
    <Stack.Screen name="IssueDetail" component={IssueDetailScreen} />
  </Stack.Navigator>
);

const ReportStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ReportIssue" component={ReportIssueScreen} />
    <Stack.Screen name="IssueDetail" component={IssueDetailScreen} />
  </Stack.Navigator>
);

const IssuesStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="MyIssues" component={MyIssuesScreen} />
    <Stack.Screen name="IssueDetail" component={IssueDetailScreen} />
  </Stack.Navigator>
);

const ProfileStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Profile" component={ProfileScreen} />
    {/* Add other profile-related screens here */}
  </Stack.Navigator>
);

const CitizenStack = () => {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          let iconLabel;

          switch (route.name) {
            case 'HomeTab':
              iconName = focused ? '🏠' : '🏡';
              iconLabel = t('common.home');
              break;
            case 'ReportTab':
              iconName = focused ? '➕' : '➕';
              iconLabel = t('issues.reportIssue');
              break;
            case 'IssuesTab':
              iconName = focused ? '📋' : '📄';
              iconLabel = t('issues.myIssues');
              break;
            case 'ProfileTab':
              iconName = focused ? '👤' : '👤';
              iconLabel = t('common.profile');
              break;
            default:
              iconName = '❓';
              iconLabel = route.name;
          }

          return (
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: size, color, marginBottom: 2 }}>{iconName}</Text>
            </View>
          );
        },
        tabBarLabel: ({ focused, color }) => {
          let label;

          switch (route.name) {
            case 'HomeTab':
              label = t('common.home');
              break;
            case 'ReportTab':
              label = t('issues.reportIssue');
              break;
            case 'IssuesTab':
              label = t('issues.myIssues');
              break;
            case 'ProfileTab':
              label = t('common.profile');
              break;
            default:
              label = route.name;
          }

          return (
            <Text style={[
              { fontSize: 12, color },
              focused && { fontWeight: 'bold' }
            ]}>
              {label}
            </Text>
          );
        },
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E0E0E0',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
          elevation: 5,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        tabBarActiveTintColor: '#4ECDC4',
        tabBarInactiveTintColor: '#999999',
        tabBarShowLabel: true,
        tabBarIndicatorStyle: {
          backgroundColor: '#4ECDC4',
          height: 2,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStack}
        options={{
          tabBarLabel: t('common.home'),
        }}
      />

      <Tab.Screen
        name="ReportTab"
        component={ReportStack}
        options={{
          tabBarLabel: t('issues.reportIssue'),
        }}
      />

      <Tab.Screen
        name="IssuesTab"
        component={IssuesStack}
        options={{
          tabBarLabel: t('issues.myIssues'),
        }}
      />

      <Tab.Screen
        name="ProfileTab"
        component={ProfileStack}
        options={{
          tabBarLabel: t('common.profile'),
        }}
      />
    </Tab.Navigator>
  );
};

export default CitizenStack;