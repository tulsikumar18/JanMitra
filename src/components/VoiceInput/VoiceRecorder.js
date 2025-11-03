import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Audio } from 'expo-av';
import Voice from '@react-native-voice/voice';
import { useTranslation } from '../../hooks/useTranslation';

const VoiceRecorder = ({
  onTranscriptionComplete,
  onAudioRecorded,
  placeholder = 'Tap to record',
  maxDuration = 60,
  language = 'en-US',
  disabled = false,
  style = {},
}) => {
  const { t, currentLanguage } = useTranslation();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioLevels, setAudioLevels] = useState([]);
  const [recording, setRecording] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState(null);

  const recordingTimer = useRef(null);
  const audioLevelTimer = useRef(null);
  const animationValue = useRef(new Animated.Value(1)).current;

  // Map current language to speech recognition language
  const getSpeechLanguage = () => {
    const languageMap = {
      en: 'en-US',
      kn: 'kn-IN', // Kannada
      hi: 'hi-IN', // Hindi
    };
    return languageMap[currentLanguage] || language;
  };

  // Initialize voice recognition
  useEffect(() => {
    Voice.onSpeechStart = onSpeechStart;
    Voice.onSpeechEnd = onSpeechEnd;
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechError = onSpeechError;
    Voice.onSpeechPartialResults = onSpeechPartialResults;

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
      }
      if (audioLevelTimer.current) {
        clearInterval(audioLevelTimer.current);
      }
    };
  }, []);

  // Check and request audio permissions
  const checkPermissions = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      setPermissionStatus(status);

      if (status !== 'granted') {
        Alert.alert(
          t('errors.microphonePermissionDenied'),
          t('errors.microphonePermissionDenied'),
          [{ text: 'OK' }]
        );
        return false;
      }

      // Check voice recognition permissions
      const voiceStatus = await Voice.isAvailable();
      if (!voiceStatus) {
        Alert.alert(
          'Voice Recognition Unavailable',
          'Voice recognition is not available on this device.',
          [{ text: 'OK' }]
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error('Permission check error:', error);
      Alert.alert(
        t('errors.somethingWentWrong'),
        'Failed to check microphone permissions.',
        [{ text: 'OK' }]
      );
      return false;
    }
  };

  // Start recording
  const startRecording = async () => {
    if (disabled || !permissionStatus) {
      const hasPermission = await checkPermissions();
      if (!hasPermission) return;
    }

    try {
      setIsRecording(true);
      setRecordingDuration(0);
      setAudioLevels([]);

      // Start voice recognition
      await Voice.start(getSpeechLanguage());

      // Start recording audio
      const { recording } = await Audio.Recording.createAsync(
        Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
      );
      setRecording(recording);

      // Start recording timer
      recordingTimer.current = setInterval(() => {
        setRecordingDuration(prev => {
          if (prev >= maxDuration) {
            stopRecording();
            return maxDuration;
          }
          return prev + 1;
        });
      }, 1000);

      // Start audio level visualization
      audioLevelTimer.current = setInterval(() => {
        const levels = Array.from({ length: 5 }, () => Math.random() * 100);
        setAudioLevels(levels);
      }, 100);

      // Start pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(animationValue, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(animationValue, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();

    } catch (error) {
      console.error('Recording start error:', error);
      setIsRecording(false);
      Alert.alert(
        t('errors.somethingWentWrong'),
        'Failed to start recording.',
        [{ text: 'OK' }]
      );
    }
  };

  // Stop recording
  const stopRecording = async () => {
    if (!isRecording) return;

    try {
      setIsRecording(false);
      setIsProcessing(true);

      // Clear timers
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
      }
      if (audioLevelTimer.current) {
        clearInterval(audioLevelTimer.current);
      }

      // Stop animation
      animationValue.setValue(1);

      // Stop voice recognition
      await Voice.stop();

      // Stop audio recording
      if (recording) {
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();

        if (onAudioRecorded && uri) {
          onAudioRecorded({
            uri,
            duration: recordingDuration,
            language: currentLanguage,
          });
        }

        setRecording(null);
      }

    } catch (error) {
      console.error('Recording stop error:', error);
      setIsProcessing(false);
      Alert.alert(
        t('errors.somethingWentWrong'),
        'Failed to stop recording.',
        [{ text: 'OK' }]
      );
    }
  };

  // Voice recognition event handlers
  const onSpeechStart = (e) => {
    console.log('Speech started:', e);
  };

  const onSpeechEnd = (e) => {
    console.log('Speech ended:', e);
    setIsProcessing(false);
  };

  const onSpeechResults = (e) => {
    if (e.value && e.value.length > 0 && onTranscriptionComplete) {
      onTranscriptionComplete(e.value[0]);
    }
    setIsProcessing(false);
  };

  const onSpeechPartialResults = (e) => {
    if (e.value && e.value.length > 0 && onTranscriptionComplete) {
      onTranscriptionComplete(e.value[0], true); // true indicates partial result
    }
  };

  const onSpeechError = (e) => {
    console.error('Speech recognition error:', e);
    setIsRecording(false);
    setIsProcessing(false);

    let errorMessage = 'Voice recognition failed.';
    if (e.error?.message) {
      errorMessage = e.error.message;
    }

    Alert.alert(
      'Voice Recognition Error',
      errorMessage,
      [{ text: 'OK' }]
    );
  };

  // Format recording duration
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Render audio level bars
  const renderAudioLevels = () => {
    if (!isRecording || audioLevels.length === 0) return null;

    return (
      <View style={styles.audioLevelsContainer}>
        {audioLevels.map((level, index) => (
          <View
            key={index}
            style={[
              styles.audioLevelBar,
              {
                height: `${level}%`,
                opacity: isRecording ? 1 : 0.3,
              },
            ]}
          />
        ))}
      </View>
    );
  };

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={[
          styles.recordButton,
          isRecording && styles.recordingButton,
          isProcessing && styles.processingButton,
          disabled && styles.disabledButton,
        ]}
        onPress={isRecording ? stopRecording : startRecording}
        disabled={disabled || isProcessing}
        activeOpacity={0.7}
      >
        <Animated.View
          style={[
            styles.recordButtonInner,
            {
              transform: [{ scale: animationValue }],
            },
          ]}
        >
          {isProcessing ? (
            <ActivityIndicator size="large" color="#FFFFFF" />
          ) : (
            <Text style={styles.recordIcon}>
              {isRecording ? '⏹️' : '🎤'}
            </Text>
          )}
        </Animated.View>
      </TouchableOpacity>

      {isRecording && (
        <View style={styles.recordingInfo}>
          <Text style={styles.durationText}>
            {formatDuration(recordingDuration)} / {formatDuration(maxDuration)}
          </Text>
          {renderAudioLevels()}
          <Text style={styles.recordingText}>
            Recording... Tap to stop
          </Text>
        </View>
      )}

      {isProcessing && (
        <View style={styles.processingInfo}>
          <Text style={styles.processingText}>
            Processing voice...
          </Text>
        </View>
      )}

      {!isRecording && !isProcessing && (
        <Text style={styles.placeholderText}>{placeholder}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  recordButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E74C3C',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  recordingButton: {
    backgroundColor: '#E74C3C',
  },
  processingButton: {
    backgroundColor: '#F39C12',
  },
  disabledButton: {
    backgroundColor: '#BDC3C7',
    shadowOpacity: 0,
    elevation: 0,
  },
  recordButtonInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordIcon: {
    fontSize: 24,
  },
  recordingInfo: {
    alignItems: 'center',
    marginTop: 12,
  },
  durationText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E74C3C',
    marginBottom: 8,
  },
  audioLevelsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 20,
    marginBottom: 8,
    gap: 2,
  },
  audioLevelBar: {
    flex: 1,
    backgroundColor: '#4ECDC4',
    borderRadius: 2,
    minWidth: 3,
  },
  recordingText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  processingInfo: {
    alignItems: 'center',
    marginTop: 12,
  },
  processingText: {
    fontSize: 14,
    color: '#F39C12',
    textAlign: 'center',
  },
  placeholderText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default VoiceRecorder;