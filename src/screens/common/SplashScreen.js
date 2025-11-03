import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const SplashScreen = () => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const textFadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    const startAnimations = () => {
      // Logo animation
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();

      // Text animation
      Animated.timing(textFadeAnim, {
        toValue: 1,
        duration: 1000,
        delay: 600,
        useNativeDriver: true,
      }).start();

      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        delay: 600,
        useNativeDriver: true,
      }).start();
    };

    startAnimations();
  }, [fadeAnim, scaleAnim, textFadeAnim, slideAnim]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={['#FF6B6B', '#4ECDC4', '#45B7D1']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Logo Container */}
        <View style={styles.logoContainer}>
          <Animated.View
            style={[
              styles.logoCircle,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <Text style={styles.logoIcon}>🏛️</Text>
          </Animated.View>
        </View>

        {/* App Name */}
        <Animated.View
          style={[
            styles.titleContainer,
            {
              opacity: textFadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.appName}>JanMitra</Text>
          <Text style={styles.tagline}>ಜನಮಿತ್ರ • जनमित्र</Text>
          <Text style={styles.subtitle}>Citizen Civic Issue Reporting Platform</Text>
        </Animated.View>

        {/* Bottom Decorative Elements */}
        <View style={styles.bottomContainer}>
          <Animated.View
            style={[
              styles.dot,
              {
                opacity: textFadeAnim,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.dot,
              styles.dot2,
              {
                opacity: textFadeAnim,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.dot,
              styles.dot3,
              {
                opacity: textFadeAnim,
              },
            ]}
          />
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 20,
  },
  logoIcon: {
    fontSize: 50,
    textAlign: 'center',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 80,
  },
  appName: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tagline: {
    fontSize: 18,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
    textAlign: 'center',
    paddingHorizontal: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    marginHorizontal: 6,
  },
  dot2: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  dot3: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
});

export default SplashScreen;