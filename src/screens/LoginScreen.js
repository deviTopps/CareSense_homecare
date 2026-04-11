import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  Animated,
  StatusBar,
  ActivityIndicator,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import COLORS from '../constants/colors';

const { width, height } = Dimensions.get('window');

const LoginScreen = () => {
  const [nursePin, setNursePin] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pinFocused, setPinFocused] = useState(false);
  const [passFocused, setPassFocused] = useState(false);
  const { login, isLoading, error } = useAuth();
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const passwordRef = useRef(null);

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 80, useNativeDriver: true }),
    ]).start();
  };

  const handleLogin = async () => {
    if (!nursePin.trim() || !password.trim()) {
      shake();
      return;
    }
    const result = await login(nursePin.trim(), password);
    if (!result.success) shake();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo Section */}
          <View style={styles.logoSection}>
            <View style={styles.logoBg}>
              <Image
                source={require('../../assets/main.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.welcomeText}>Welcome back</Text>
            <Text style={styles.subtitleText}>Sign in to continue your shift</Text>
          </View>

          {/* Form Card */}
          <Animated.View style={[styles.formCard, { transform: [{ translateX: shakeAnim }] }]}>
            {/* Error */}
            {error ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color={COLORS.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Nurse PIN */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Nurse PIN</Text>
              <View
                style={[
                  styles.inputWrapper,
                  pinFocused && styles.inputFocused,
                ]}
              >
                <Ionicons
                  name="id-card-outline"
                  size={20}
                  color={pinFocused ? COLORS.primary : COLORS.grayText}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your PIN"
                  placeholderTextColor="#A0B0BA"
                  value={nursePin}
                  onChangeText={setNursePin}
                  keyboardType="number-pad"
                  maxLength={10}
                  onFocus={() => setPinFocused(true)}
                  onBlur={() => setPinFocused(false)}
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Password</Text>
              <View
                style={[
                  styles.inputWrapper,
                  passFocused && styles.inputFocused,
                ]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={passFocused ? COLORS.primary : COLORS.grayText}
                />
                <TextInput
                  ref={passwordRef}
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor="#A0B0BA"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  onFocus={() => setPassFocused(true)}
                  onBlur={() => setPassFocused(false)}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons
                    name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color={COLORS.grayText}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot password */}
            <TouchableOpacity style={styles.forgotBtn}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            {/* Sign In Button */}
            <TouchableOpacity
              style={styles.loginBtn}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[COLORS.primary, COLORS.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.loginBtnGradient}
              >
                {isLoading ? (
                  <ActivityIndicator color={COLORS.white} size="small" />
                ) : (
                  <>
                    <Text style={styles.loginBtnText}>Sign In</Text>
                    <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* Footer */}
          <View style={styles.footer}>
            <Ionicons name="shield-checkmark-outline" size={14} color={COLORS.grayText} />
            <Text style={styles.footerText}>
              Account managed by your agency admin
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 30,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoBg: {
    width: 180,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logo: {
    width: 180,
    height: 180,
  },
  welcomeText: {
    fontSize: 26,
    fontFamily: 'Outfit-Bold', fontWeight: '700',
    color: COLORS.darkText,
    marginTop: 16,
  },
  subtitleText: {
    fontSize: 15,
    fontFamily: 'Outfit-Regular', fontWeight: '400',
    color: COLORS.grayText,
    marginTop: 4,
  },
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    padding: 24,
    gap: 16,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0EE',
    borderRadius: 10,
    padding: 12,
    gap: 8,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.error,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 13,
    flex: 1,
    fontFamily: 'Outfit-Medium', fontWeight: '500',
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontFamily: 'Outfit-SemiBold', fontWeight: '600',
    color: COLORS.darkText,
    marginLeft: 2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: COLORS.lightGray,
    paddingHorizontal: 14,
    height: 52,
    gap: 10,
  },
  inputFocused: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.lightGreen,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.darkText,
    fontFamily: 'Outfit-Medium', fontWeight: '500',
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginTop: -8,
  },
  forgotText: {
    color: COLORS.primary,
    fontSize: 13,
    fontFamily: 'Outfit-SemiBold', fontWeight: '600',
  },
  loginBtn: {
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 4,
  },
  loginBtnGradient: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  loginBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontFamily: 'Outfit-Bold', fontWeight: '700',
    letterSpacing: 0.5,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
    gap: 6,
  },
  footerText: {
    color: COLORS.grayText,
    fontSize: 12,
    fontFamily: 'Outfit-Regular', fontWeight: '400',
  },
});

export default LoginScreen;
