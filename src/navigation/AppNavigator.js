import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { supabase } from '../config/supabase';
import { initializeLanguage } from '../locales';
import AuthStack from './AuthStack';
import CitizenStack from './CitizenStack';
import GovernmentStack from './GovernmentStack';
import SplashScreen from '../screens/common/SplashScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);

  // Initialize app
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize language
        await initializeLanguage();

        // Check for existing session
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Session error:', error);
        } else if (session?.user) {
          setUser(session.user);

          // Fetch user profile to get role
          const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('role')
            .eq('id', session.user.id)
            .single();

          if (profileError) {
            console.error('Profile error:', profileError);
          } else {
            setUserRole(profile?.role);
          }
        }
      } catch (error) {
        console.error('App initialization error:', error);
      } finally {
        setInitializing(false);
        // Add a small delay for splash screen effect
        setTimeout(() => setLoading(false), 1500);
      }
    };

    initializeApp();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);

        if (session?.user) {
          setUser(session.user);

          // Fetch user profile to get role
          const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('role')
            .eq('id', session.user.id)
            .single();

          if (profileError) {
            console.error('Profile fetch error:', profileError);
            setUserRole(null);
          } else {
            setUserRole(profile?.role);
          }
        } else {
          setUser(null);
          setUserRole(null);
        }
      }
    );

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  // Show splash screen while initializing
  if (initializing || loading) {
    return <SplashScreen />;
  }

  // Determine which stack to show
  const getInitialRouteName = () => {
    if (!user) {
      return 'Auth';
    }

    switch (userRole) {
      case 'government':
        return 'Government';
      case 'citizen':
      default:
        return 'Citizen';
    }
  };

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={getInitialRouteName()}
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          animationDuration: 300,
        }}
      >
        {/* Auth Stack */}
        <Stack.Screen
          name="Auth"
          component={AuthStack}
          options={{
            gestureEnabled: false,
          }}
        />

        {/* Citizen Stack */}
        <Stack.Screen
          name="Citizen"
          component={CitizenStack}
          options={{
            gestureEnabled: false,
          }}
        />

        {/* Government Stack */}
        <Stack.Screen
          name="Government"
          component={GovernmentStack}
          options={{
            gestureEnabled: false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;