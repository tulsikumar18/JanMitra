import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Animated,
  TextInput,
} from 'react-native';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { useTranslation } from '../../hooks/useTranslation';

const VoiceRecorder = ({
  onTextComplete,
  onAudioRecorded,
  placeholder = 'Tap to record or type text',
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
  const [text, setText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);

  const recordingTimer = useRef(null);
  const audioLevelTimer = useRef(null);
  const animationValue = useRef(new Animated.Value(1)).current;

  // Map current language to speech language
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
    return () => {
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
          'Microphone Permission',
          'Permission to access microphone is required for audio recording.',
          [{ text: 'OK' }]
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error('Permission check error:', error);
      Alert.alert(
        'Error',
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
        'Error',
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

      setIsProcessing(false);

    } catch (error) {
      console.error('Recording stop error:', error);
      setIsProcessing(false);
      Alert.alert(
        'Error',
        'Failed to stop recording.',
        [{ text: 'OK' }]
      );
    }
  };

  // Speak text (text-to-speech)
  const speakText = async () => {
    if (!text.trim()) return;

    try {
      setIsSpeaking(true);
      const options = {
        language: getSpeechLanguage(),
        pitch: 1.0,
        rate: 0.9,
        volume: 1.0,
      };

      await Speech.speak(text, options);
    } catch (error) {
      console.error('Speech error:', error);
      Alert.alert(
        'Speech Error',
        'Failed to speak text.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSpeaking(false);
    }
  };

  // Stop speaking
  const stopSpeaking = async () => {
    try {
      await Speech.stop();
      setIsSpeaking(false);
    } catch (error) {
      console.error('Stop speech error:', error);
    }
  };

  // Handle text input
  const handleTextChange = (value) => {
    setText(value);
    if (onTextComplete) {
      onTextComplete(value);
    }
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
      {/* Text Input */}
      <View style={styles.textInputContainer}>
        <TextInput
          style={[
            styles.textInput,
            disabled && styles.disabledInput,
          ]}
          value={text}
          onChangeText={handleTextChange}
          placeholder={placeholder}
          placeholderTextColor="#999"
          multiline
          numberOfLines={3}
          editable={!disabled}
        />

        {text.trim() && (
          <TouchableOpacity
            style={[
              styles.speakButton,
              isSpeaking && styles.speakingButton,
            ]}
            onPress={isSpeaking ? stopSpeaking : speakText}
            activeOpacity={0.7}
          >
            <Text style={styles.speakButtonIcon}>
              {isSpeaking ? '⏹️' : '🔊'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Voice Recording Controls */}
      <View style={styles.controlsContainer}>
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
              <Text style={styles.processingText}>⏳</Text>
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
            <Text style={styles.processingText}>Processing audio...</Text>
          </View>
        )}
      </View>

      {/* Instructions */}
      {!isRecording && !isProcessing && (
        <Text style={styles.instructionText}>
          Type text above or record audio for voice notes
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  textInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#2C3E50',
    backgroundColor: '#F8F9FA',
    minHeight: 80,
    textAlignVertical: 'top',
    marginRight: 12,
  },
  disabledInput: {
    backgroundColor: '#F5F7FA',
    color: '#BDC3C7',
  },
  speakButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4ECDC4',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  speakingButton: {
    backgroundColor: '#F39C12',
  },
  speakButtonIcon: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  controlsContainer: {
    alignItems: 'center',
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
  processingText: {
    fontSize: 20,
    color: '#FFFFFF',
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
  instructionText: {
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
});

export default VoiceRecorder;