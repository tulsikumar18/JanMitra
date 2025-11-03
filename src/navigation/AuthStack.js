import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import LanguageSelectionScreen from '../screens/auth/LanguageSelectionScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import LoginScreen from '../screens/auth/LoginScreen';

const Stack = createStackNavigator();

const AuthStack = () => {
  return (
    <Stack.Navigator
      initialRouteName="LanguageSelection"
      screenOptions={{
        headerShown: false,
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
        name="LanguageSelection"
        component={LanguageSelectionScreen}
        options={{
          gestureEnabled: false, // Disable back gesture on language selection
        }}
      />
      <Stack.Screen
        name="Signup"
        component={SignupScreen}
        options={{
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{
          gestureEnabled: true,
        }}
      />
    </Stack.Navigator>
  );
};

export default AuthStack;