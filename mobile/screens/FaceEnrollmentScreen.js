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
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import Svg, { Ellipse } from 'react-native-svg';
import { enrollFace } from '../services/api';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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

  // Set up screen options or log warning if missing parameters
  useEffect(() => {
    if (!studentId) {
      Alert.alert('Error', 'Missing student context. Returning to roster.', [
        { text: 'OK', onPress: () => navigation.goBack() }
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
        skipProcessing: false,
      });

      if (!photo?.base64) {
        throw new Error('Failed to retrieve image raw base64 data.');
      }

      // Send to backend route
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
                onPress: () => navigation.replace('AdminDashboard') 
              }
            ]
          );
        }
      } else {
        Alert.alert('Enrollment Warning', res.data?.message || 'Face matching failed. Make sure your face is centered and lit.');
      }
    } catch (err) {
      console.error(err);
      const detail = err.response?.data?.detail || 'Failed to connect to biometric service.';
      Alert.alert('Face Capture Failed', detail);
    } finally {
      setLoading(false);
    }
  };

  if (!permission) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.statusText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <Text style={styles.permissionTitle}>Camera Access Required</Text>
        <Text style={styles.permissionDesc}>
          Biometric face enrollment requires access to your front camera.
        </Text>
        <TouchableOpacity style={styles.grantButton} onPress={requestPermission}>
          <Text style={styles.grantButtonText}>Grant Camera Permission</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <CameraView ref={cameraRef} style={StyleSheet.absoluteFillObject} facing={cameraFacing}>
        
        {/* Semi-transparent dark layout mask (focus overlay) */}
        <View style={styles.maskContainer}>
          <Svg style={StyleSheet.absoluteFillObject}>
            <Ellipse
              cx={SCREEN_WIDTH / 2}
              cy={SCREEN_HEIGHT * 0.45}
              rx={110}
              ry={140}
              fill="transparent"
              stroke="#10B981"
              strokeWidth={3}
              strokeDasharray="10, 5"
            />
          </Svg>
        </View>

        {/* Outer Corner brackets guide */}
        <View
          style={[
            styles.bracketContainer,
            { top: SCREEN_HEIGHT * 0.45 - 150, left: SCREEN_WIDTH / 2 - 120 },
          ]}
        >
          <View style={styles.bracketTopLeft} />
          <View style={styles.bracketTopRight} />
          <View style={styles.bracketBottomLeft} />
          <View style={styles.bracketBottomRight} />
        </View>

        {/* Foreground Content Stack */}
        <SafeAreaView style={styles.overlayContent}>
          {/* Top Header Row */}
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.circleButton}
              onPress={() => navigation.goBack()}
              disabled={loading}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelText}>✕</Text>
            </TouchableOpacity>

            <View style={styles.pillContainer}>
              <Text style={styles.appTitle}>Hostel Biometric</Text>
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

          {/* Active Instructions */}
          <View style={styles.instructionBanner}>
            <Text style={styles.instructionText}>
              {loading ? 'Analyzing face...' : INSTRUCTIONS[capturedCount] || 'All done!'}
            </Text>
          </View>

          {/* Bottom Control Actions */}
          <View style={styles.bottomControls}>
            {/* Progress Counters */}
            <Text style={styles.progressText}>
              Photo {capturedCount} of 3 captured
            </Text>

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

            {/* Glowing Action Trigger Button */}
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
        </SafeAreaView>

        {/* Flash Effect View */}
        <Animated.View
          style={[
            styles.flashOverlay,
            {
              opacity: flashAnim,
            },
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
    backgroundColor: '#000000',
  },
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

  // --- Permission View ---
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

  // --- Layout Masks & Guides ---
  maskContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  bracketContainer: {
    position: 'absolute',
    width: 240,
    height: 300,
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

  // --- Foreground Content ---
  overlayContent: {
    flex: 1,
    justifyContent: 'space-between',
    zIndex: 30,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 12 : 12,
  },
  circleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(25, 27, 35, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cancelText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  switchIcon: {
    fontSize: 16,
  },
  pillContainer: {
    backgroundColor: 'rgba(25, 27, 35, 0.4)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  appTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  instructionBanner: {
    alignSelf: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 12,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  instructionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // --- Bottom controls ---
  bottomControls: {
    alignItems: 'center',
    paddingBottom: 36,
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

  // --- Flash Effect ---
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
    zIndex: 999,
  },
});
