import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { logAction } from '../services/api';
import useStore from '../store/useStore';

export default function StudentFoundModalScreen({ route, navigation }) {
  const { result } = route.params || {};
  const user = useStore((s) => s.user); // The logged-in guard user
  const [loading, setLoading] = useState(false);

  if (!result) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No scan data available.</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isMatched = result.matched;

  const handleConfirm = async () => {
    if (!isMatched) return;
    setLoading(true);

    try {
      // Log check-in/check-out outpass action
      await logAction(
        result.student.id,
        result.next_action,
        result.confidence,
        user.id // Logged by active guard user
      );

      Alert.alert(
        result.next_action === 'OUT' ? '🔴 Checked OUT' : '🟢 Checked IN',
        `${result.student.name} was successfully verified and marked ${result.next_action}.`,
        [
          {
            text: 'Done',
            onPress: () => {
              // Return to scan screen
              navigation.navigate('GuardScan');
            },
          },
        ]
      );
    } catch (err) {
      console.error('Logging action failed:', err);
      const msg = err?.response?.data?.detail || 'Failed to record entry/exit transaction. Please try again.';
      Alert.alert('Logging Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF8FF" />

      {/* Main card box mimicking the bottom-sheet visual mock design */}
      <View style={styles.cardContainer}>
        {isMatched ? (
          <View style={styles.innerCard}>
            {/* Top Match Confidence Pill */}
            <View style={styles.confidencePill}>
              <Text style={styles.confidenceCheck}>✓</Text>
              <Text style={styles.confidenceText}>
                Match Confidence: {result.confidence?.toFixed(1)}%
              </Text>
            </View>

            {/* Avatar Group */}
            <View style={styles.avatarWrapper}>
              <View style={styles.avatarBorderCircle}>
                {result.student.photo_url ? (
                  <Image
                    source={{ uri: result.student.photo_url }}
                    style={styles.avatarImage}
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarPlaceholderText}>
                      {result.student.name
                        ? result.student.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2)
                        : 'ST'}
                    </Text>
                  </View>
                )}
              </View>
              {/* Checkmark verification badge */}
              <View style={styles.verificationBadge}>
                <Text style={styles.verificationBadgeIcon}>✓</Text>
              </View>
            </View>

            {/* Student Info */}
            <Text style={styles.studentName}>{result.student.name}</Text>
            <Text style={styles.studentMeta}>
              Roll: {result.student.roll_number}   ·   Room: {result.student.room_number}
            </Text>

            {/* Confirm Check-in / Check-out Button */}
            <TouchableOpacity
              style={[
                styles.confirmButton,
                result.next_action === 'OUT' ? styles.confirmButtonOut : styles.confirmButtonIn,
                loading && styles.buttonDisabled,
              ]}
              onPress={handleConfirm}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.confirmButtonText}>
                  {result.next_action === 'OUT' ? 'CONFIRM CHECK-OUT' : 'CONFIRM CHECK-IN'}
                </Text>
              )}
            </TouchableOpacity>

            {/* Cancel Button */}
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => navigation.goBack()}
              disabled={loading}
              activeOpacity={0.85}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.innerCard}>
            {/* Warning Triangle Circle */}
            <View style={styles.warningCircle}>
              <Text style={styles.warningIcon}>⚠️</Text>
            </View>

            {/* Unknown Title & Message */}
            <Text style={styles.unknownTitle}>Unknown Person</Text>
            <Text style={styles.unknownSubtitle}>
              Biometric scan failed to find a match in the active roster.
            </Text>

            {/* Scan Again Button */}
            <TouchableOpacity
              style={styles.scanAgainButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.85}
            >
              <Text style={styles.scanAgainButtonIcon}>🔄</Text>
              <Text style={styles.scanAgainButtonText}>Try Scanning Again</Text>
            </TouchableOpacity>

            {/* Manual Override Action */}
            <TouchableOpacity
              style={styles.overrideButton}
              onPress={() => {
                Alert.alert(
                  'Manual Override',
                  'Admin privileges are required for manual override. Please contact the system administrator.'
                );
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.overrideButtonText}>Manual Override (Admin)</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContainer: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: '#E7E7F3',
    padding: 24,
    shadowColor: '#191B23',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 8,
  },
  innerCard: {
    alignItems: 'center',
    width: '100%',
  },

  // ─── Identified State ──────────────────────────────────────────
  confidencePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 24,
  },
  confidenceCheck: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
    marginRight: 6,
  },
  confidenceText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 20,
  },
  avatarBorderCircle: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 3,
    borderColor: '#2563EB',
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 48,
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 48,
    backgroundColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2563EB',
  },
  verificationBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  verificationBadgeIcon: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 12,
  },
  studentName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#191B23',
    marginBottom: 6,
    textAlign: 'center',
  },
  studentMeta: {
    fontSize: 14,
    color: '#737686',
    fontWeight: '600',
    marginBottom: 32,
    textAlign: 'center',
  },
  confirmButton: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmButtonOut: {
    backgroundColor: '#C22020',
    shadowColor: '#C22020',
  },
  confirmButtonIn: {
    backgroundColor: '#16A34A',
    shadowColor: '#16A34A',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  cancelButton: {
    width: '100%',
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#737686',
    fontSize: 15,
    fontWeight: '600',
  },

  // ─── Unknown State ──────────────────────────────────────────────
  warningCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FEE2E2',
    borderWidth: 2,
    borderColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  warningIcon: {
    fontSize: 32,
  },
  unknownTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#DC2626',
    marginBottom: 12,
    textAlign: 'center',
  },
  unknownSubtitle: {
    fontSize: 14,
    color: '#737686',
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 28,
    paddingHorizontal: 16,
  },
  scanAgainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E7E7F3',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  scanAgainButtonIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  scanAgainButtonText: {
    color: '#191B23',
    fontSize: 15,
    fontWeight: '700',
  },
  overrideButton: {
    width: '100%',
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overrideButtonText: {
    color: '#737686',
    fontSize: 14,
    fontWeight: '600',
  },

  // ─── Error State ────────────────────────────────────────────────
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAF8FF',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#737686',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
