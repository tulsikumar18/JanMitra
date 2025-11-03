import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useTranslation } from '../hooks/useTranslation';

// Import screens (to be created)
import DashboardScreen from '../screens/government/DashboardScreen';
import IssueListScreen from '../screens/government/IssueListScreen';
import IssueDetailScreen from '../screens/government/IssueDetailScreen';
import ProfileScreen from '../screens/government/GovernmentProfileScreen';
import ReportsScreen from '../screens/government/ReportsScreen';

const Stack = createStackNavigator();

const GovernmentStack = () => {
  const { t } = useTranslation();

  return (
    <Stack.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        headerStyle: {
          backgroundColor: '#4ECDC4',
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 0,
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
        },
        headerBackTitleVisible: false,
        headerBackTitleStyle: {
          color: '#FFFFFF',
        },
        gestureEnabled: true,
        gestureDirection: 'horizontal',
        cardStyleInterpolator: ({ current, layouts }) => {
          return {
            cardStyle: {
              transform: [
                {
                  translateX: current.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [layouts.screen.width, 0],
                  }),
                },
              ],
            },
          };
        },
      }}
    >
      <Stack.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: t('government.dashboard'),
          headerLeft: null, // Disable back button on dashboard
          gestureEnabled: false, // Disable swipe back on dashboard
        }}
      />

      <Stack.Screen
        name="IssueList"
        component={IssueListScreen}
        options={{
          title: t('government.manageIssues'),
        }}
      />

      <Stack.Screen
        name="IssueDetail"
        component={IssueDetailScreen}
        options={{
          title: t('issues.issueDetails'),
        }}
      />

      <Stack.Screen
        name="Reports"
        component={ReportsScreen}
        options={{
          title: t('government.statistics'),
        }}
      />

      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: t('common.profile'),
        }}
      />
    </Stack.Navigator>
  );
};

export default GovernmentStack;