import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import useStore from '../store/useStore';
import { registerStudent } from '../services/api';

const YEARS = [
  { label: '1st Year (Freshman)', value: '1' },
  { label: '2nd Year (Sophomore)', value: '2' },
  { label: '3rd Year (Junior)', value: '3' },
  { label: '4th Year (Senior)', value: '4' },
  { label: 'Postgraduate', value: '5' },
];

export default function RegisterStudentScreen({ navigation }) {
  const user = useStore((s) => s.user);

  // Form State
  const [form, setForm] = useState({
    name: '',
    roll_number: '',
    department: '',
    year: '',
    room_number: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [yearPickerVisible, setYearPickerVisible] = useState(false);

  const updateField = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
  };

  const getYearLabel = () => {
    const selected = YEARS.find((y) => y.value === form.year);
    return selected ? selected.label : 'Select Year';
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.roll_number.trim()) {
      Alert.alert('Validation Error', 'Full Name and Roll Number are required.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        user_id: user.id,
        name: form.name.trim(),
        roll_number: form.roll_number.trim(),
        department: form.department.trim() || null,
        year: form.year ? parseInt(form.year) : null,
        room_number: form.room_number.trim() || null,
        phone: form.phone.trim() || null,
      };

      const res = await registerStudent(payload);
      const studentData = res.data.student;

      Alert.alert(
        'Success ✅',
        `${studentData.full_name} profile created successfully.`,
        [
          {
            text: 'Enroll Face Now',
            onPress: () =>
              navigation.replace('FaceEnrollment', {
                studentId: studentData.id,
                studentName: studentData.full_name,
              }),
          },
          {
            text: 'Register Another',
            onPress: () => {
              setForm({
                name: '',
                roll_number: '',
                department: '',
                year: '',
                room_number: '',
                phone: '',
              });
            },
          },
        ]
      );
    } catch (err) {
      const message =
        err.response?.data?.detail || 'Failed to register student. Try again later.';
      Alert.alert('Registration Failed', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF8FF" />

      {/* Task Top App Bar */}
      <View style={styles.appBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={styles.backArrow}>⬅️</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Register Student</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Form Card container */}
          <View style={styles.formCard}>
            {/* Name Input */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={styles.inputField}
                placeholder="e.g. Jane Doe"
                placeholderTextColor="#C3C6D7"
                value={form.name}
                onChangeText={(v) => updateField('name', v)}
                editable={!loading}
              />
            </View>

            {/* Roll Number Input */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Roll Number *</Text>
              <TextInput
                style={[styles.inputField, styles.monoText]}
                placeholder="e.g. CS2023001"
                placeholderTextColor="#C3C6D7"
                value={form.roll_number}
                onChangeText={(v) => updateField('roll_number', v)}
                autoCapitalize="characters"
                editable={!loading}
              />
            </View>

            {/* Department Input */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Department</Text>
              <TextInput
                style={styles.inputField}
                placeholder="e.g. Computer Science"
                placeholderTextColor="#C3C6D7"
                value={form.department}
                onChangeText={(v) => updateField('department', v)}
                editable={!loading}
              />
            </View>

            {/* Year selector dropdown */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Year of Study</Text>
              <TouchableOpacity
                style={styles.dropdownField}
                onPress={() => setYearPickerVisible(true)}
                disabled={loading}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.dropdownText,
                    !form.year && styles.placeholderText,
                  ]}
                >
                  {getYearLabel()}
                </Text>
                <Text style={styles.dropdownArrow}>▼</Text>
              </TouchableOpacity>
            </View>

            {/* Room Number Input */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Room Number</Text>
              <TextInput
                style={[styles.inputField, styles.monoText]}
                placeholder="e.g. B-204"
                placeholderTextColor="#C3C6D7"
                value={form.room_number}
                onChangeText={(v) => updateField('room_number', v)}
                autoCapitalize="characters"
                editable={!loading}
              />
            </View>

            {/* Parent's Phone Input */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Parent's Phone</Text>
              <View style={styles.phoneInputContainer}>
                <View style={styles.phonePrefix}>
                  <Text style={styles.phonePrefixText}>+91</Text>
                </View>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="98765 43210"
                  placeholderTextColor="#C3C6D7"
                  value={form.phone}
                  onChangeText={(v) => updateField('phone', v)}
                  keyboardType="phone-pad"
                  editable={!loading}
                />
              </View>
            </View>

            {/* Encryption Indicator */}
            <View style={styles.encryptionRow}>
              <Text style={styles.encryptionIcon}>🛡️</Text>
              <Text style={styles.encryptionText}>
                Data secured via end-to-end encryption.
              </Text>
            </View>
          </View>

          {/* Continue to Face Scan CTA Button (Inside ScrollView to prevent keyboard overlap) */}
          <View style={styles.footerCTA}>
            <TouchableOpacity
              style={[styles.ctaButton, loading && styles.ctaButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.9}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.ctaButtonText}>
                  Continue to Face Scan  ➔
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>


      {/* Year Picker Modal */}
      <Modal
        visible={yearPickerVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setYearPickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setYearPickerVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Year of Study</Text>
            <FlatList
              data={YEARS}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalOption,
                    form.year === item.value && styles.modalOptionSelected,
                  ]}
                  onPress={() => {
                    updateField('year', item.value);
                    setYearPickerVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      form.year === item.value && styles.modalOptionTextSelected,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8FF',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: '#E7E7F3',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  backArrow: {
    fontSize: 18,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#191B23',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 24,
  },

  // --- Form Card ---
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E7E7F3',
    shadowColor: '#191B23',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
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
    textTransform: 'uppercase',
  },
  inputField: {
    height: 48,
    borderWidth: 1,
    borderColor: '#C3C6D7',
    borderRadius: 12,
    backgroundColor: '#FAF8FF',
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#191B23',
  },
  monoText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },

  // --- Dropdown Field ---
  dropdownField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
    borderWidth: 1,
    borderColor: '#C3C6D7',
    borderRadius: 12,
    backgroundColor: '#FAF8FF',
    paddingHorizontal: 16,
  },
  dropdownText: {
    fontSize: 16,
    color: '#191B23',
  },
  placeholderText: {
    color: '#C3C6D7',
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#434655',
  },

  // --- Phone Group ---
  phoneInputContainer: {
    flexDirection: 'row',
    height: 48,
  },
  phonePrefix: {
    width: 60,
    height: '100%',
    backgroundColor: '#FAF8FF',
    borderWidth: 1,
    borderColor: '#C3C6D7',
    borderRightWidth: 0,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phonePrefixText: {
    fontSize: 16,
    color: '#434655',
    fontWeight: '500',
  },
  phoneInput: {
    flex: 1,
    height: '100%',
    borderWidth: 1,
    borderColor: '#C3C6D7',
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    backgroundColor: '#FAF8FF',
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#191B23',
  },

  // --- Encryption Info ---
  encryptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderColor: '#FAF8FF',
  },
  encryptionIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  encryptionText: {
    fontSize: 13,
    color: '#737686',
  },

  // --- Fixed CTA Footer ---
  footerCTA: {
    marginTop: 8,
    paddingBottom: 16,
  },
  ctaButton: {
    height: 52,
    backgroundColor: '#10B981',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  ctaButtonDisabled: {
    opacity: 0.7,
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // --- Modal styles ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(25, 27, 35, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    maxHeight: '60%',
    shadowColor: '#191B23',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#191B23',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalOption: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: '#FAF8FF',
  },
  modalOptionSelected: {
    backgroundColor: '#FAF8FF',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#434655',
    textAlign: 'center',
  },
  modalOptionTextSelected: {
    fontWeight: '600',
    color: '#2563EB',
  },
});
