import React, { useRef, useState, useEffect } from 'react';
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
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import Svg, { Ellipse } from 'react-native-svg';
import { enrollFace } from '../services/api';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Responsive guide dimensions (matches GuardScanScreen pattern)
const OVAL_CX = SCREEN_WIDTH / 2;
const OVAL_CY = SCREEN_HEIGHT * 0.42;
const OVAL_RX = SCREEN_WIDTH * 0.32;
const OVAL_RY = SCREEN_WIDTH * 0.42;

const INSTRUCTIONS = [
  'Look straight at the camera',
  'Turn slightly to your LEFT',
  'Turn slightly to your RIGHT',
];

export default function FaceEnrollmentScreen({ route, navigation }) {
  const { studentId, studentName } = route.params || {};
  const cameraRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();

  // States
  const [capturedCount, setCapturedCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [cameraFacing, setCameraFacing] = useState('front');
  const flashAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!studentId) {
      Alert.alert('Error', 'Missing student context. Returning to roster.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    }
  }, [studentId]);

  const triggerFlash = () => {
    flashAnim.setValue(1);
    Animated.timing(flashAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const toggleCameraFacing = () => {
    setCameraFacing((f) => (f === 'front' ? 'back' : 'front'));
  };

  const handleCapture = async () => {
    if (loading || capturedCount >= 3) return;
    if (!cameraRef.current) return;

    setLoading(true);
    triggerFlash();

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.6,
        base64: true,
      });

      if (!photo?.base64) {
        throw new Error('Failed to retrieve image raw base64 data.');
      }

      const res = await enrollFace(studentId, photo.base64);

      if (res.data?.success) {
        const nextCount = capturedCount + 1;
        setCapturedCount(nextCount);

        if (nextCount === 3) {
          Alert.alert(
            'Enrollment Complete ✅',
            `${studentName || 'Student'}'s biometric face profile has been registered.`,
            [
              {
                text: 'Done',
                onPress: () => navigation.replace('AdminDashboard'),
              },
            ]
          );
        }
      } else {
        Alert.alert(
          'Enrollment Warning',
          res.data?.message || 'Face matching failed. Make sure your face is centered and lit.'
        );
      }
    } catch (err) {
      console.error(err);
      const detail =
        err.response?.data?.detail || 'Failed to connect to biometric service.';
      Alert.alert('Face Capture Failed', detail);
    } finally {
      setLoading(false);
    }
  };

  // ─── Permission: Loading ─────────────────────────────────────
  if (!permission) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.statusText}>Requesting camera permission...</Text>
      </View>
    );
  }

  // ─── Permission: Not Granted ─────────────────────────────────
  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <Text style={styles.permissionTitle}>Camera Access Required</Text>
        <Text style={styles.permissionDesc}>
          We need camera access to capture the student's face for biometric enrollment.
        </Text>
        <TouchableOpacity style={styles.grantButton} onPress={requestPermission}>
          <Text style={styles.grantButtonText}>Grant Camera Permission</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ─── Main Camera UI ──────────────────────────────────────────
  // IMPORTANT: This uses the EXACT same rendering pattern as GuardScanScreen.
  // Each overlay element is a DIRECT child of CameraView with its own
  // absolute positioning. No wrapper container. This prevents Android
  // from collapsing flex children inside CameraView.
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <CameraView ref={cameraRef} style={styles.camera} facing={cameraFacing}>

        {/* ─── Oval Face Guide (SVG) ─────────────────────────── */}
        <Animated.View
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        >
          <Svg style={StyleSheet.absoluteFill}>
            <Ellipse
              cx={OVAL_CX}
              cy={OVAL_CY}
              rx={OVAL_RX}
              ry={OVAL_RY}
              fill="transparent"
              stroke={loading ? '#F59E0B' : '#10B981'}
              strokeWidth={3}
              strokeDasharray={loading ? '0' : '10, 5'}
            />
          </Svg>
        </Animated.View>

        {/* ─── Corner Brackets Guide ─────────────────────────── */}
        <View
          style={[
            styles.bracketContainer,
            {
              top: OVAL_CY - OVAL_RY - 8,
              left: OVAL_CX - OVAL_RX - 8,
              width: OVAL_RX * 2 + 16,
              height: OVAL_RY * 2 + 16,
            },
          ]}
          pointerEvents="none"
        >
          <View style={styles.bracketTopLeft} />
          <View style={styles.bracketTopRight} />
          <View style={styles.bracketBottomLeft} />
          <View style={styles.bracketBottomRight} />
        </View>

        {/* ─── Header Bar (direct child, absolute) ───────────── */}
        <SafeAreaView style={styles.headerBar}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.circleButton}
              onPress={() => navigation.goBack()}
              disabled={loading}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelText}>✕</Text>
            </TouchableOpacity>

            <View style={styles.pillContainer}>
              <Text style={styles.appTitle}>Face Enrollment</Text>
            </View>

            <TouchableOpacity
              style={styles.circleButton}
              onPress={toggleCameraFacing}
              disabled={loading}
              activeOpacity={0.7}
            >
              <Text style={styles.switchIcon}>🔄</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        {/* ─── Instruction Pill (direct child, absolute) ─────── */}
        <View style={styles.instructionContainer}>
          <View style={styles.instructionPill}>
            <Text style={styles.instructionIcon}>📸</Text>
            <Text style={styles.instructionText}>
              {loading
                ? 'Analyzing face...'
                : INSTRUCTIONS[capturedCount] || 'All done!'}
            </Text>
          </View>
        </View>

        {/* ─── Bottom Controls (direct child, absolute) ──────── */}
        <View style={styles.bottomControls}>
          {/* Progress text */}
          <Text style={styles.progressText}>
            Photo {capturedCount} of 3 captured
          </Text>

          {/* Progress dots */}
          <View style={styles.progressDotsRow}>
            {[0, 1, 2].map((i) => (
              <View
                key={i}
                style={[
                  styles.progressDot,
                  i < capturedCount && styles.progressDotActive,
                ]}
              />
            ))}
          </View>

          {/* Capture button */}
          <TouchableOpacity
            style={[
              styles.captureOuterBtn,
              loading && styles.captureOuterBtnDisabled,
            ]}
            onPress={handleCapture}
            disabled={loading || capturedCount >= 3}
            activeOpacity={0.8}
          >
            <View style={styles.captureInnerBtn}>
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.cameraEmoji}>📸</Text>
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* ─── Flash Effect ──────────────────────────────────── */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: 'white', opacity: flashAnim },
          ]}
          pointerEvents="none"
        />
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  // CRITICAL: Use flex: 1 (NOT absoluteFillObject) — matches GuardScanScreen
  camera: {
    flex: 1,
  },

  // ─── Loading / Permission ──────────────────────────────────────
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAF8FF',
  },
  statusText: {
    marginTop: 12,
    fontSize: 16,
    color: '#434655',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAF8FF',
    paddingHorizontal: 32,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#191B23',
    marginBottom: 12,
  },
  permissionDesc: {
    fontSize: 15,
    color: '#434655',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  grantButton: {
    height: 52,
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grantButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },

  // ─── Corner Bracket Guides ─────────────────────────────────────
  bracketContainer: {
    position: 'absolute',
  },
  bracketTopLeft: {
    position: 'absolute',
    top: -4,
    left: -4,
    width: 24,
    height: 24,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#FFFFFF',
    borderTopLeftRadius: 8,
  },
  bracketTopRight: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 24,
    height: 24,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: '#FFFFFF',
    borderTopRightRadius: 8,
  },
  bracketBottomLeft: {
    position: 'absolute',
    bottom: -4,
    left: -4,
    width: 24,
    height: 24,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#FFFFFF',
    borderBottomLeftRadius: 8,
  },
  bracketBottomRight: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 24,
    height: 24,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: '#FFFFFF',
    borderBottomRightRadius: 8,
  },

  // ─── Header Bar (matches GuardScanScreen.headerBar) ────────────
  headerBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  circleButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(25, 27, 35, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  cancelText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  switchIcon: {
    fontSize: 18,
  },
  pillContainer: {
    backgroundColor: 'rgba(25, 27, 35, 0.5)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  appTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  // ─── Instruction (matches GuardScanScreen.instructionContainer) ─
  instructionContainer: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.16,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 5,
  },
  instructionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(37, 99, 235, 0.92)',
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
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // ─── Bottom Controls (matches GuardScanScreen.scanButtonContainer) ─
  bottomControls: {
    position: 'absolute',
    bottom: 36,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
  },
  progressDotsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  progressDot: {
    width: 36,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  progressDotActive: {
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
  },
  captureOuterBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
  },
  captureOuterBtnDisabled: {
    backgroundColor: '#C3C6D7',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  captureInnerBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraEmoji: {
    fontSize: 22,
  },
});
