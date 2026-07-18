import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StatusBar,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { login } from '../services/api';
import useStore from '../store/useStore';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const setAuth = useStore((s) => s.setAuth);

  const handleLogin = async () => {
    if (!email.trim()) {
      Alert.alert('Validation Error', 'Please enter your email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await login(email.trim());
      const { token, user_id, role, college_name } = res.data;

      await setAuth(token, { id: user_id, college_name }, role);

      // Navigate based on role
      if (role === 'admin') {
        navigation.replace('AdminDashboard');
      } else if (role === 'guard') {
        navigation.replace('GuardScan');
      }
    } catch (err) {
      const message =
        err.response?.data?.detail || 'Login failed. Check your email and try again.';
      Alert.alert('Login Failed', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF8FF" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Section */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="shield-checkmark" size={32} color="#2563EB" />
            </View>
            <Text style={styles.title}>Hostel Biometric</Text>
            <Text style={styles.subtitle}>Institutional Security Dashboard</Text>
          </View>

          {/* Form Section */}
          <View style={styles.form}>
            {/* Email Field */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>EMAIL ADDRESS</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color="#737686" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="admin@institution.edu"
                  placeholderTextColor="#C3C6D7"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  returnKeyType="next"
                  editable={!loading}
                />
              </View>
            </View>

            {/* Password Field */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>PASSWORD</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="key-outline" size={20} color="#737686" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#C3C6D7"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!passwordVisible}
                  autoCapitalize="none"
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                  editable={!loading}
                />
                <TouchableOpacity
                  style={styles.visibilityToggle}
                  onPress={() => setPasswordVisible(!passwordVisible)}
                  activeOpacity={0.6}
                >
                  <Ionicons 
                    name={passwordVisible ? "eye-off-outline" : "eye-outline"} 
                    size={20} 
                    color="#737686" 
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.loginButtonText}>LOGIN TO DASHBOARD</Text>
              )}
            </TouchableOpacity>

            {/* Forgot Password */}
            <TouchableOpacity style={styles.forgotContainer} activeOpacity={0.6}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              POWERED BY BIOMETRIC AI <Ionicons name="lock-closed" size={14} color="#C3C6D7" />
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8FF',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 24,
  },

  // --- Header ---
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E7E7F3',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(195, 198, 215, 0.3)',
  },
  iconText: {
    fontSize: 28,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#191B23',
    letterSpacing: -0.56,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#434655',
    lineHeight: 20,
  },

  // --- Form ---
  form: {
    width: '100%',
  },
  fieldGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.6,
    color: '#434655',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderWidth: 1,
    borderColor: '#C3C6D7',
    borderRadius: 12,
    backgroundColor: '#FAF8FF',
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#191B23',
    lineHeight: 24,
  },
  visibilityToggle: {
    paddingLeft: 8,
    paddingVertical: 4,
  },
  visibilityIcon: {
    fontSize: 20,
  },

  // --- Login Button ---
  loginButton: {
    width: '100%',
    height: 52,
    backgroundColor: '#2563EB',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.6,
  },

  // --- Forgot Password ---
  forgotContainer: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 4,
  },
  forgotText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#004AC6',
  },

  // --- Footer ---
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
    color: '#737686',
    opacity: 0.7,
  },
});
