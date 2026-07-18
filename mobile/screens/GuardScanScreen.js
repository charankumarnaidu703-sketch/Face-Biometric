import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Animated,
  Dimensions,
  Modal,
  Image,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Ellipse } from 'react-native-svg';
import { identifyFace } from '../services/api';
import useStore from '../store/useStore';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Oval dimensions for face centering guide
const OVAL_CX = SCREEN_WIDTH / 2;
const OVAL_CY = SCREEN_HEIGHT * 0.38;
const OVAL_RX = SCREEN_WIDTH * 0.34;
const OVAL_RY = SCREEN_WIDTH * 0.46;

export default function GuardScanScreen({ navigation }) {
  const cameraRef = useRef(null);
  const user = useStore((s) => s.user);
  const logout = useStore((s) => s.logout);
  const [permission, requestPermission] = useCameraPermissions();

  const handleLogout = async () => {
    await logout();
    navigation.replace('Login');
  };

  // Scanning state machine
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null); // null = idle, object = result ready
  const [cameraFacing, setCameraFacing] = useState('back'); // 'back' or 'front'

  // Pulse animation for the oval border when scanning
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const flashAnim = useRef(new Animated.Value(0)).current;

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.06,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopPulse = () => {
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);
  };

  const triggerFlash = () => {
    flashAnim.setValue(1);
    Animated.timing(flashAnim, {
      toValue: 0,
      duration: 350,
      useNativeDriver: true,
    }).start();
  };

  const handleScan = async () => {
    if (scanning || !cameraRef.current) return;
    setScanning(true);
    startPulse();

    try {
      // Capture photo frame from live camera
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.35,
        base64: true,
      });

      triggerFlash();

      // Send to backend for 1:N face identification (with retry for tunnel errors)
      let res;
      let attempts = 0;
      const maxRetries = 2;
      while (attempts <= maxRetries) {
        try {
          res = await identifyFace(photo.base64, user.id, cameraFacing === 'front');
          break;
        } catch (retryErr) {
          const status = retryErr?.response?.status;
          if ((status === 502 || status === 503) && attempts < maxRetries) {
            attempts++;
            await new Promise(r => setTimeout(r, 1000));
          } else {
            throw retryErr;
          }
        }
      }
      setScanResult(res.data);
    } catch (err) {
      console.error('Scan failed:', err);
      const detail = err?.response?.data?.detail;
      const reason = err?.response?.data?.reason;
      const message = detail || reason || 'Scan failed. Please try again.';
      Alert.alert('Scan Error', message);
    } finally {
      setScanning(false);
      stopPulse();
    }
  };

  const handleDismissResult = () => {
    setScanResult(null);
  };

  // ─── Permission Gate ──────────────────────────────────────────
  if (!permission) {
    return (
      <View style={styles.permissionContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#FAF8FF" />
        <View style={styles.permissionCard}>
          <Text style={styles.permissionIcon}>📸</Text>
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionSubtitle}>
            The guard scan screen needs access to your device camera to identify
            students at the gate.
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermission}
            activeOpacity={0.85}
          >
            <Text style={styles.permissionButtonText}>Grant Camera Access</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Scan Result Overlay ──────────────────────────────────────
  const renderResultOverlay = () => {
    if (!scanResult) return null;

    const isMatched = scanResult.matched;

    return (
      <Modal
        visible={true}
        transparent
        animationType="fade"
        onRequestClose={handleDismissResult}
      >
        <View style={styles.resultOverlay}>
          <View
            style={[
              styles.resultCard,
              { borderColor: isMatched ? '#16A34A' : '#DC2626' },
            ]}
          >
            {/* Status Icon / Student Avatar */}
            {isMatched && scanResult.student?.photo_url ? (
              <Image
                source={{ uri: scanResult.student.photo_url }}
                style={styles.resultAvatarImage}
              />
            ) : (
              <View
                style={[
                  styles.resultIconCircle,
                  {
                    backgroundColor: isMatched
                      ? 'rgba(22, 163, 74, 0.1)'
                      : 'rgba(220, 38, 38, 0.1)',
                  },
                ]}
              >
                <Ionicons 
                  name={isMatched ? "checkmark-circle" : "close-circle"} 
                  size={54} 
                  color={isMatched ? "#16A34A" : "#DC2626"} 
                />
              </View>
            )}

            {/* Title */}
            <Text
              style={[
                styles.resultTitle,
                { color: isMatched ? '#16A34A' : '#DC2626' },
              ]}
            >
              {isMatched ? 'Student Identified' : 
                scanResult.reason === 'NO_FACE_IN_FRAME' ? 'No Face Detected' :
                scanResult.reason === 'NO_STUDENTS_ENROLLED' ? 'No Students Enrolled' :
                scanResult.reason === 'LOW_CONFIDENCE' ? 'Low Confidence' :
                'No Match Found'}
            </Text>

            {/* Details */}
            {isMatched ? (
              <View style={styles.resultDetails}>
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Name</Text>
                  <Text style={styles.resultValue}>
                    {scanResult.student.name}
                  </Text>
                </View>
                <View style={styles.resultDivider} />
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Roll No.</Text>
                  <Text style={styles.resultValue}>
                    {scanResult.student.roll_number}
                  </Text>
                </View>
                <View style={styles.resultDivider} />
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Phone</Text>
                  <Text style={styles.resultValue}>
                    {scanResult.student.phone || 'N/A'}
                  </Text>
                </View>
                <View style={styles.resultDivider} />
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Room</Text>
                  <Text style={styles.resultValue}>
                    {scanResult.student.room_number}
                  </Text>
                </View>
                <View style={styles.resultDivider} />
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Confidence</Text>
                  <Text style={[styles.resultValue, { color: '#2563EB', fontWeight: '700' }]}>
                    {scanResult.confidence?.toFixed(1)}%
                  </Text>
                </View>
                <View style={styles.resultDivider} />
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Next Action</Text>
                  <View
                    style={[
                      styles.actionBadge,
                      {
                        backgroundColor:
                          scanResult.next_action === 'OUT'
                            ? '#FEF3C7'
                            : '#DCFCE7',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.actionBadgeText,
                        {
                          color:
                            scanResult.next_action === 'OUT'
                              ? '#D97706'
                              : '#16A34A',
                        },
                      ]}
                    >
                      {scanResult.next_action === 'OUT'
                        ? '🚶 Checking OUT'
                        : '🏠 Checking IN'}
                    </Text>
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.resultDetails}>
                <Text style={styles.noMatchText}>
                  {scanResult.reason === 'NO_STUDENTS_ENROLLED'
                    ? 'No students have been enrolled yet. Ask the administrator to enroll student faces first.'
                    : scanResult.reason === 'NO_FACE_IN_FRAME'
                    ? 'No face was detected in the camera frame. Make sure the student is looking at the camera with their face inside the oval guide.'
                    : scanResult.reason === 'LOW_CONFIDENCE'
                    ? `A potential match was found but the confidence was too low (${scanResult.confidence?.toFixed(1) || '?'}%). Please try scanning again with better lighting.`
                    : 'The scanned face did not match any enrolled student. Please try again or ask the student to re-enroll.'}
                </Text>
              </View>
            )}

            {/* Action Buttons */}
            {isMatched && (
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={() => {
                  // Navigate to the StudentFoundModal for confirmation logging
                  handleDismissResult();
                  navigation.navigate('StudentFoundModal', {
                    result: scanResult,
                  });
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.confirmButtonText}>
                  Confirm {scanResult.next_action === 'OUT' ? 'Exit' : 'Entry'}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.dismissButton}
              onPress={handleDismissResult}
              activeOpacity={0.85}
            >
              <Text style={styles.dismissButtonText}>
                {isMatched ? 'Cancel' : 'Try Again'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  // ─── Main Camera UI ───────────────────────────────────────────
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Camera Feed */}
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={cameraFacing}
      >
        {/* Header Bar */}
        <SafeAreaView style={styles.headerBar}>
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.7}>
              <Text style={styles.logoutIcon}>🚪</Text>
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Hostel Biometric</Text>
              <Text style={styles.headerSubtitle}>MAIN GATE PORT</Text>
            </View>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>
                {user?.full_name
                  ? user.full_name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)
                  : user?.email?.[0]?.toUpperCase() || 'G'}
              </Text>
            </View>
          </View>
        </SafeAreaView>

        {/* Instruction Label */}
        <View style={styles.instructionContainer}>
          <View style={styles.instructionPill}>
            <Ionicons name="scan-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.instructionText}>
              {scanning ? 'Scanning face...' : 'Center face in oval'}
            </Text>
          </View>
        </View>

        {/* Oval Face Guide */}
        <Animated.View
          style={[StyleSheet.absoluteFill, { transform: [{ scale: pulseAnim }] }]}
          pointerEvents="none"
        >
          <Svg style={StyleSheet.absoluteFill}>
            <Ellipse
              cx={OVAL_CX}
              cy={OVAL_CY}
              rx={OVAL_RX}
              ry={OVAL_RY}
              fill="transparent"
              stroke={scanning ? '#F59E0B' : '#00D4AA'}
              strokeWidth={3.5}
              strokeDasharray={scanning ? '0' : '14,8'}
            />
          </Svg>
        </Animated.View>

        {/* Camera Flash Feedback */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: 'white', opacity: flashAnim },
          ]}
          pointerEvents="none"
        />

        {/* Scan Button */}
        <View style={styles.scanButtonContainer}>
          <TouchableOpacity
            style={[
              styles.scanButton,
              scanning && styles.scanButtonDisabled,
            ]}
            onPress={handleScan}
            disabled={scanning}
            activeOpacity={0.85}
          >
            {scanning ? (
              <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 10 }} />
            ) : (
              <Text style={styles.scanButtonIcon}>📋</Text>
            )}
            <Text style={styles.scanButtonText}>
              {scanning ? 'SCANNING...' : 'SCAN FACE'}
            </Text>
          </TouchableOpacity>

          {/* Flip Camera Button */}
          <TouchableOpacity
            style={styles.flipButton}
            onPress={() => setCameraFacing(prev => prev === 'back' ? 'front' : 'back')}
            activeOpacity={0.7}
          >
            <Ionicons name="camera-reverse-outline" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </CameraView>

      {/* Result Overlay Modal */}
      {renderResultOverlay()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },

  // ─── Header ───────────────────────────────────────────────────
  headerBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: 'rgba(250, 248, 255, 0.95)',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    paddingBottom: 12,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF1F2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFE4E6',
  },
  logoutIcon: {
    fontSize: 18,
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2563EB',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#737686',
    letterSpacing: 1.2,
    marginTop: 2,
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#E0E7FF',
    borderWidth: 2,
    borderColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2563EB',
  },

  // ─── Instruction ──────────────────────────────────────────────
  instructionContainer: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.16,
    width: '100%',
    alignItems: 'center',
    zIndex: 5,
  },
  instructionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  instructionIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  instructionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#191B23',
  },

  // ─── Scan Button ──────────────────────────────────────────────
  scanButtonContainer: {
    position: 'absolute',
    bottom: 36,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    paddingVertical: 18,
    paddingHorizontal: 56,
    borderRadius: 50,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  scanButtonDisabled: {
    backgroundColor: '#93A8D6',
  },
  scanButtonIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  scanButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  flipButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },

  // ─── Permission Gate ──────────────────────────────────────────
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAF8FF',
  },
  permissionCard: {
    marginHorizontal: 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#191B23',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  permissionIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#191B23',
    marginBottom: 8,
    textAlign: 'center',
  },
  permissionSubtitle: {
    fontSize: 14,
    color: '#737686',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  // ─── Result Overlay Modal ─────────────────────────────────────
  resultOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
  },
  resultAvatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#16A34A',
    marginBottom: 16,
  },
  resultIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultIconEmoji: {
    fontSize: 32,
  },
  resultTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 20,
  },
  resultDetails: {
    width: '100%',
    marginBottom: 20,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  resultLabel: {
    fontSize: 14,
    color: '#737686',
    fontWeight: '500',
  },
  resultValue: {
    fontSize: 15,
    color: '#191B23',
    fontWeight: '600',
    maxWidth: '60%',
    textAlign: 'right',
  },
  resultDivider: {
    height: 1,
    backgroundColor: '#E7E7F3',
    width: '100%',
  },
  actionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  actionBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  noMatchText: {
    fontSize: 14,
    color: '#737686',
    textAlign: 'center',
    lineHeight: 22,
  },

  // ─── Buttons ──────────────────────────────────────────────────
  confirmButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  dismissButton: {
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
  },
  dismissButtonText: {
    color: '#737686',
    fontSize: 15,
    fontWeight: '600',
  },
});
