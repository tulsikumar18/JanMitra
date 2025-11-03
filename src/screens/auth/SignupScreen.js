import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from '../../hooks/useTranslation';
import { authHelpers } from '../../config/supabase';

const SignupScreen = ({ navigation }) => {
  const { t, currentLanguage, isRTL } = useTranslation();
  const [formData, setFormData] = useState({
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    area: '',
    role: 'citizen',
    acceptTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [selectedArea, setSelectedArea] = useState(null);
  const [showAreaDropdown, setShowAreaDropdown] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const bengaluruAreas = [
    { id: 'bengaluruCentral', name: t('areas.bengaluruCentral') },
    { id: 'bengaluruEast', name: t('areas.bengaluruEast') },
    { id: 'bengaluruNorth', name: t('areas.bengaluruNorth') },
    { id: 'bengaluruSouth', name: t('areas.bengaluruSouth') },
    { id: 'bengaluruWest', name: t('areas.bengaluruWest') },
    { id: 'yelahanka', name: t('areas.yelahanka') },
    { id: 'dasarahalli', name: t('areas.dasarahalli') },
    { id: 'rajajinagar', name: t('areas.rajajinagar') },
    { id: 'chickpet', name: t('areas.chickpet') },
    { id: 'shanthinagar', name: t('areas.shanthinagar') },
    { id: 'jaynagar', name: t('areas.jaynagar') },
    { id: 'btmLayout', name: t('areas.btmLayout') },
    { id: 'koramangala', name: t('areas.koramangala') },
    { id: 'hsrLayout', name: t('areas.hsrLayout') },
    { id: 'whitefield', name: t('areas.whitefield') },
    { id: 'indiranagar', name: t('areas.indiranagar') },
    { id: 'marathahalli', name: t('areas.marathahalli') },
    { id: 'electronicCity', name: t('areas.electronicCity') },
  ];

  const validateForm = () => {
    const newErrors = {};

    // Phone validation (Indian phone numbers)
    if (!formData.phone) {
      newErrors.phone = t('auth.phone');
    } else if (!/^[6-9]\d{9}$/.test(formData.phone)) {
      newErrors.phone = t('auth.invalidPhone');
    }

    // Email validation (optional but if provided must be valid)
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('auth.invalidEmail');
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = t('auth.password');
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = t('auth.confirmPassword');
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('auth.passwordMismatch');
    }

    // Name validation
    if (!formData.fullName) {
      newErrors.fullName = t('auth.nameRequired');
    } else if (formData.fullName.length < 2) {
      newErrors.fullName = 'Name must be at least 2 characters';
    } else if (formData.fullName.length > 100) {
      newErrors.fullName = 'Name must be less than 100 characters';
    }

    // Area validation
    if (!selectedArea) {
      newErrors.area = t('auth.areaRequired');
    }

    // Terms validation
    if (!formData.acceptTerms) {
      newErrors.acceptTerms = t('auth.acceptTerms');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Create user data for Supabase
      const userData = {
        full_name: formData.fullName,
        phone: formData.phone,
        email: formData.email || null,
        role: formData.role,
        area: selectedArea.id,
        preferred_language: currentLanguage,
        created_at: new Date().toISOString(),
      };

      let result;
      if (formData.email) {
        result = await authHelpers.signUpWithEmail(
          formData.email,
          formData.password,
          userData
        );
      } else {
        result = await authHelpers.signUpWithPhone(
          formData.phone,
          formData.password,
          userData
        );
      }

      if (result.user) {
        Alert.alert(
          'Success!',
          'Your account has been created successfully. Please check your email/phone for verification.',
          [
            {
              text: 'OK',
              onPress: () => navigation.replace('Login'),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Signup error:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to create account. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const handleAreaSelect = (area) => {
    setSelectedArea(area);
    setShowAreaDropdown(false);
    handleInputChange('area', area.id);

    if (errors.area) {
      setErrors(prev => ({
        ...prev,
        area: '',
      }));
    }
  };

  const renderRoleButtons = () => (
    <View style={styles.roleContainer}>
      <TouchableOpacity
        style={[
          styles.roleButton,
          formData.role === 'citizen' && styles.selectedRole,
        ]}
        onPress={() => handleInputChange('role', 'citizen')}
      >
        <Text style={[
          styles.roleText,
          formData.role === 'citizen' && styles.selectedRoleText,
        ]}>
          {t('auth.citizen')}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.roleButton,
          formData.role === 'government' && styles.selectedRole,
        ]}
        onPress={() => handleInputChange('role', 'government')}
      >
        <Text style={[
          styles.roleText,
          formData.role === 'government' && styles.selectedRoleText,
        ]}>
          {t('auth.government')}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderAreaDropdown = () => (
    <View style={styles.dropdownContainer}>
      <TouchableOpacity
        style={[
          styles.dropdownButton,
          errors.area && styles.errorInput,
        ]}
        onPress={() => setShowAreaDropdown(!showAreaDropdown)}
      >
        <Text style={[
          styles.dropdownText,
          !selectedArea && styles.placeholderText,
        ]}>
          {selectedArea ? selectedArea.name : t('areas.selectArea')}
        </Text>
        <Text style={styles.dropdownArrow}>▼</Text>
      </TouchableOpacity>

      {showAreaDropdown && (
        <View style={styles.dropdownList}>
          <ScrollView style={styles.areaList}>
            {bengaluruAreas.map(area => (
              <TouchableOpacity
                key={area.id}
                style={styles.areaItem}
                onPress={() => handleAreaSelect(area)}
              >
                <Text style={styles.areaText}>{area.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <LinearGradient
          colors={['#FF6B6B', '#4ECDC4', '#45B7D1']}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerText}>{t('auth.signup')}</Text>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View
              style={[
                styles.formContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              {/* Name */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>{t('auth.fullName')}</Text>
                <TextInput
                  style={[
                    styles.input,
                    errors.fullName && styles.errorInput,
                    isRTL && { textAlign: 'right' },
                  ]}
                  value={formData.fullName}
                  onChangeText={(value) => handleInputChange('fullName', value)}
                  placeholder={t('auth.fullName')}
                  placeholderTextColor="#999"
                />
                {errors.fullName && (
                  <Text style={styles.errorText}>{errors.fullName}</Text>
                )}
              </View>

              {/* Phone */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>{t('auth.phone')} *</Text>
                <TextInput
                  style={[
                    styles.input,
                    errors.phone && styles.errorInput,
                    isRTL && { textAlign: 'right' },
                  ]}
                  value={formData.phone}
                  onChangeText={(value) => handleInputChange('phone', value.replace(/[^0-9]/g, ''))}
                  placeholder="9876543210"
                  placeholderTextColor="#999"
                  keyboardType="phone-pad"
                  maxLength={10}
                />
                {errors.phone && (
                  <Text style={styles.errorText}>{errors.phone}</Text>
                )}
              </View>

              {/* Email */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>{t('auth.email')}</Text>
                <TextInput
                  style={[
                    styles.input,
                    errors.email && styles.errorInput,
                    isRTL && { textAlign: 'right' },
                  ]}
                  value={formData.email}
                  onChangeText={(value) => handleInputChange('email', value)}
                  placeholder="email@example.com"
                  placeholderTextColor="#999"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                {errors.email && (
                  <Text style={styles.errorText}>{errors.email}</Text>
                )}
              </View>

              {/* Password */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>{t('auth.password')} *</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[
                      styles.passwordInput,
                      errors.password && styles.errorInput,
                      isRTL && { textAlign: 'right' },
                    ]}
                    value={formData.password}
                    onChangeText={(value) => handleInputChange('password', value)}
                    placeholder={t('auth.password')}
                    placeholderTextColor="#999"
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Text style={styles.eyeText}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
                  </TouchableOpacity>
                </View>
                {errors.password && (
                  <Text style={styles.errorText}>{errors.password}</Text>
                )}
              </View>

              {/* Confirm Password */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>{t('auth.confirmPassword')} *</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[
                      styles.passwordInput,
                      errors.confirmPassword && styles.errorInput,
                      isRTL && { textAlign: 'right' },
                    ]}
                    value={formData.confirmPassword}
                    onChangeText={(value) => handleInputChange('confirmPassword', value)}
                    placeholder={t('auth.confirmPassword')}
                    placeholderTextColor="#999"
                    secureTextEntry={!showConfirmPassword}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <Text style={styles.eyeText}>{showConfirmPassword ? '👁️' : '👁️‍🗨️'}</Text>
                  </TouchableOpacity>
                </View>
                {errors.confirmPassword && (
                  <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                )}
              </View>

              {/* Area Dropdown */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>{t('auth.area')} *</Text>
                {renderAreaDropdown()}
                {errors.area && (
                  <Text style={styles.errorText}>{errors.area}</Text>
                )}
              </View>

              {/* Role Selection */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>{t('auth.selectRole')} *</Text>
                {renderRoleButtons()}
                {errors.role && (
                  <Text style={styles.errorText}>{errors.role}</Text>
                )}
              </View>

              {/* Terms and Conditions */}
              <View style={styles.termsContainer}>
                <TouchableOpacity
                  style={styles.checkboxContainer}
                  onPress={() => handleInputChange('acceptTerms', !formData.acceptTerms)}
                >
                  <View style={[
                    styles.checkbox,
                    formData.acceptTerms && styles.checkedCheckbox,
                  ]}>
                    {formData.acceptTerms && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={styles.termsText}>
                    {t('auth.termsAndConditions')}
                  </Text>
                </TouchableOpacity>
                {errors.acceptTerms && (
                  <Text style={styles.errorText}>{errors.acceptTerms}</Text>
                )}
              </View>

              {/* Signup Button */}
              <TouchableOpacity
                style={[styles.signupButton, isLoading && styles.disabledButton]}
                onPress={handleSignup}
                disabled={isLoading}
              >
                <Text style={styles.signupButtonText}>
                  {isLoading ? t('common.loading') : t('auth.signup')}
                </Text>
              </TouchableOpacity>

              {/* Login Link */}
              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>{t('auth.alreadyHaveAccount')} </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.loginLink}>{t('auth.login')}</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </ScrollView>
        </LinearGradient>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 10,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  backButtonText: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#2C3E50',
    backgroundColor: '#F8F9FA',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#2C3E50',
    backgroundColor: '#F8F9FA',
  },
  eyeButton: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#F8F9FA',
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    borderLeftWidth: 1,
    borderLeftColor: '#E0E0E0',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    borderRightWidth: 1,
    borderRightColor: '#E0E0E0',
  },
  eyeText: {
    fontSize: 18,
  },
  errorInput: {
    borderColor: '#E74C3C',
    borderWidth: 2,
  },
  errorText: {
    fontSize: 14,
    color: '#E74C3C',
    marginTop: 5,
  },
  dropdownContainer: {
    position: 'relative',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#F8F9FA',
  },
  dropdownText: {
    fontSize: 16,
    color: '#2C3E50',
    flex: 1,
  },
  placeholderText: {
    color: '#999',
  },
  dropdownArrow: {
    fontSize: 14,
    color: '#666',
  },
  dropdownList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderTopWidth: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    maxHeight: 200,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  areaList: {
    maxHeight: 200,
  },
  areaItem: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  areaText: {
    fontSize: 16,
    color: '#2C3E50',
  },
  roleContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
  },
  selectedRole: {
    borderColor: '#4ECDC4',
    backgroundColor: '#E8F6F5',
  },
  roleText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  selectedRoleText: {
    color: '#4ECDC4',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkedCheckbox: {
    backgroundColor: '#4ECDC4',
    borderColor: '#4ECDC4',
  },
  checkmark: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  termsText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    lineHeight: 20,
  },
  signupButton: {
    backgroundColor: '#4ECDC4',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 20,
  },
  disabledButton: {
    backgroundColor: '#B0BEC5',
  },
  signupButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 16,
    color: '#666',
  },
  loginLink: {
    fontSize: 16,
    color: '#4ECDC4',
    fontWeight: '600',
  },
});

export default SignupScreen;