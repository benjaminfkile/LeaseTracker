import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import type { PhotoFile } from 'react-native-vision-camera';
import MlkitOcr from 'react-native-mlkit-ocr';
import type { MlkitOcrResult } from 'react-native-mlkit-ocr';
import { palette, useTheme } from '../../theme';
import type { HomeStackNavigationProp, HomeStackParamList } from '../../navigation/types';

// ---------- OCR Parsing ----------

function parseLargestOdometerReading(blocks: MlkitOcrResult): number | null {
  const allText = blocks.map(b => b.text).join(' ');
  // Match 5 or 6 consecutive digits, bounded by non-digit characters
  const matches = allText.match(/(?<!\d)\d{5,6}(?!\d)/g);
  if (!matches || matches.length === 0) return null;
  const nums = matches.map(m => parseInt(m, 10));
  return Math.max(...nums);
}

// ---------- Screen ----------

type ScreenState = 'preview' | 'processing' | 'result';

export function OdometerCameraScreen(): React.ReactElement {
  const theme = useTheme();
  const navigation = useNavigation<HomeStackNavigationProp>();
  const route = useRoute<RouteProp<HomeStackParamList, 'OdometerCamera'>>();
  const { leaseId } = route.params;

  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');
  const cameraRef = useRef<Camera>(null);

  const [screenState, setScreenState] = useState<ScreenState>('preview');
  const [parsedReading, setParsedReading] = useState<number | null>(null);
  const [ocrError, setOcrError] = useState<string | null>(null);

  const handleCapture = async () => {
    if (!cameraRef.current) return;
    setScreenState('processing');
    setOcrError(null);
    try {
      const photo: PhotoFile = await cameraRef.current.takePhoto({ flash: 'off' });
      const uri = Platform.OS === 'android' ? `file://${photo.path}` : photo.path;
      const blocks: MlkitOcrResult = await MlkitOcr.detectFromUri(uri);
      const reading = parseLargestOdometerReading(blocks);
      setParsedReading(reading);
      setScreenState('result');
    } catch {
      setOcrError('Could not process the image. Please try again.');
      setScreenState('result');
    }
  };

  const handleUseReading = () => {
    if (parsedReading !== null) {
      navigation.navigate('AddReading', { leaseId, initialMileage: parsedReading });
    }
  };

  const handleRetake = () => {
    setParsedReading(null);
    setOcrError(null);
    setScreenState('preview');
  };

  // ---------- Permission gate ----------

  if (!hasPermission) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.permissionTitle, { color: theme.colors.textPrimary }]}>
          Camera Permission Required
        </Text>
        <Text style={[styles.permissionBody, { color: theme.colors.textSecondary }]}>
          Allow camera access to scan your odometer display.
        </Text>
        <TouchableOpacity
          style={[styles.permissionButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => void requestPermission()}
          accessibilityRole="button"
          testID="grant-permission-button"
        >
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.cancelLink}
          accessibilityRole="button"
          testID="cancel-button"
        >
          <Text style={[styles.cancelLinkText, { color: theme.colors.textSecondary }]}>
            Cancel
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.permissionTitle, { color: theme.colors.textPrimary }]}>
          No Camera Found
        </Text>
        <Text style={[styles.permissionBody, { color: theme.colors.textSecondary }]}>
          A camera is not available on this device.
        </Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.permissionButton, { backgroundColor: theme.colors.primary }]}
          accessibilityRole="button"
          testID="go-back-button"
        >
          <Text style={styles.permissionButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ---------- Camera view ----------

  return (
    <View style={styles.container} testID="odometer-camera-screen">
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={screenState === 'preview'}
        photo={true}
      />

      {/* Top overlay: close button + hint */}
      <View style={styles.topOverlay}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.closeButton}
          accessibilityRole="button"
          accessibilityLabel="Close camera"
          testID="close-camera-button"
        >
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
        {screenState === 'preview' && (
          <Text style={styles.hintText}>
            Point at your odometer and tap Capture
          </Text>
        )}
      </View>

      {/* Center target guide */}
      {screenState === 'preview' && (
        <View pointerEvents="none" style={styles.targetFrame} />
      )}

      {/* Processing overlay */}
      {screenState === 'processing' && (
        <View style={styles.processingOverlay} testID="processing-overlay">
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.processingText}>Reading odometer…</Text>
        </View>
      )}

      {/* Result overlay */}
      {screenState === 'result' && (
        <View style={styles.resultOverlay} testID="result-overlay">
          {ocrError || parsedReading === null ? (
            <>
              <Text style={styles.resultErrorText}>
                {ocrError ?? 'No odometer reading detected. Please try again.'}
              </Text>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleRetake}
                accessibilityRole="button"
                testID="retake-button"
              >
                <Text style={styles.primaryButtonText}>Try Again</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => navigation.goBack()}
                accessibilityRole="button"
                testID="enter-manually-button"
              >
                <Text style={styles.secondaryButtonText}>Enter Manually</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.resultLabel}>Odometer Reading Detected</Text>
              <Text style={styles.resultValue} testID="parsed-reading">
                {parsedReading.toLocaleString()}
              </Text>
              <Text style={styles.resultUnit}>miles</Text>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleUseReading}
                accessibilityRole="button"
                testID="use-reading-button"
              >
                <Text style={styles.primaryButtonText}>Use This Reading</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleRetake}
                accessibilityRole="button"
                testID="retake-button"
              >
                <Text style={styles.secondaryButtonText}>Retake</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}

      {/* Bottom: Capture button */}
      {screenState === 'preview' && (
        <View style={styles.captureRow}>
          <TouchableOpacity
            style={styles.captureButton}
            onPress={() => void handleCapture()}
            accessibilityRole="button"
            accessibilityLabel="Capture odometer photo"
            testID="capture-button"
          >
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cancelLink: {
    marginTop: 16,
    paddingVertical: 8,
  },
  cancelLinkText: {
    fontSize: 15,
  },
  captureButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderColor: '#FFFFFF',
    borderRadius: 40,
    borderWidth: 3,
    height: 80,
    justifyContent: 'center',
    width: 80,
  },
  captureButtonInner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    height: 56,
    width: 56,
  },
  captureRow: {
    alignItems: 'center',
    bottom: 60,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  center: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  container: {
    backgroundColor: '#000000',
    flex: 1,
  },
  hintText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginTop: 12,
    opacity: 0.9,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  permissionBody: {
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
    textAlign: 'center',
  },
  permissionButton: {
    borderRadius: 10,
    marginTop: 24,
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: palette.brand,
    borderRadius: 10,
    marginTop: 20,
    paddingHorizontal: 32,
    paddingVertical: 14,
    width: '100%',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    gap: 16,
  },
  processingText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  resultErrorText: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 4,
    opacity: 0.9,
    textAlign: 'center',
  },
  resultLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  resultOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.82)',
    bottom: 0,
    left: 0,
    paddingBottom: 48,
    paddingHorizontal: 24,
    paddingTop: 32,
    position: 'absolute',
    right: 0,
  },
  resultUnit: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 18,
    marginBottom: 8,
    marginTop: 2,
  },
  resultValue: {
    color: '#FFFFFF',
    fontSize: 52,
    fontWeight: '700',
    letterSpacing: -1,
    marginTop: 4,
  },
  secondaryButton: {
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 10,
    width: '100%',
  },
  secondaryButtonText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 15,
    fontWeight: '500',
  },
  targetFrame: {
    borderColor: 'rgba(255,255,255,0.7)',
    borderRadius: 12,
    borderWidth: 2,
    height: 160,
    left: '10%',
    position: 'absolute',
    top: '35%',
    width: '80%',
  },
  topOverlay: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
});
