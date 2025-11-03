import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Image,
  Modal,
  Dimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from '../../hooks/useTranslation';

const { width, height } = Dimensions.get('window');

const CustomImagePicker = ({
  images = [],
  onImagesChange,
  maxImages = 5,
  maxFileSize = 10 * 1024 * 1024, // 10MB
  quality = 0.7,
  allowsMultiple = true,
  placeholder = 'Add photos of the issue',
  style = {},
}) => {
  const { t } = useTranslation();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const scrollViewRef = useRef(null);

  // Request media library permissions
  const requestMediaLibraryPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        t('errors.fileUploadError'),
        'Permission to access media library is required!',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  // Request camera permissions
  const requestCameraPermissions = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        t('errors.cameraPermissionDenied'),
        'Permission to access camera is required!',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  // Pick images from gallery
  const pickFromGallery = async () => {
    setIsModalVisible(false);

    const hasPermission = await requestMediaLibraryPermissions();
    if (!hasPermission) return;

    try {
      const options = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultiple,
        quality,
        maxFileSize,
        selectionLimit: allowsMultiple ? maxImages - images.length : 1,
      };

      const result = await ImagePicker.launchImageLibraryAsync(options);

      if (!result.canceled && result.assets) {
        const validImages = result.assets.filter(asset =>
          !asset.canceled && asset.fileSize <= maxFileSize
        );

        if (validImages.length === 0) {
          Alert.alert(
            t('errors.invalidFile'),
            'No valid images were selected.',
            [{ text: 'OK' }]
          );
          return;
        }

        const newImages = validImages.map(asset => ({
          uri: asset.uri,
          name: asset.fileName || `image_${Date.now()}.jpg`,
          type: asset.mimeType || 'image/jpeg',
          size: asset.fileSize,
          width: asset.width,
          height: asset.height,
        }));

        const updatedImages = [...images, ...newImages].slice(0, maxImages);

        if (onImagesChange) {
          onImagesChange(updatedImages);
        }

        // Auto-scroll to the end
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    } catch (error) {
      console.error('Gallery picker error:', error);
      Alert.alert(
        t('errors.fileUploadError'),
        'Failed to pick images from gallery.',
        [{ text: 'OK' }]
      );
    }
  };

  // Take photo with camera
  const takePhoto = async () => {
    setIsModalVisible(false);

    const hasPermission = await requestCameraPermissions();
    if (!hasPermission) return;

    try {
      const options = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality,
        allowsEditing: true,
        aspect: [4, 3],
      };

      const result = await ImagePicker.launchCameraAsync(options);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];

        if (asset.fileSize > maxFileSize) {
          Alert.alert(
            t('errors.fileTooLarge'),
            `Image size exceeds ${Math.round(maxFileSize / 1024 / 1024)}MB limit.`,
            [{ text: 'OK' }]
          );
          return;
        }

        const newImage = {
          uri: asset.uri,
          name: asset.fileName || `photo_${Date.now()}.jpg`,
          type: asset.mimeType || 'image/jpeg',
          size: asset.fileSize,
          width: asset.width,
          height: asset.height,
        };

        const updatedImages = [...images, newImage].slice(0, maxImages);

        if (onImagesChange) {
          onImagesChange(updatedImages);
        }

        // Auto-scroll to the end
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    } catch (error) {
      console.error('Camera picker error:', error);
      Alert.alert(
        t('errors.fileUploadError'),
        'Failed to take photo.',
        [{ text: 'OK' }]
      );
    }
  };

  // Remove image
  const removeImage = (index) => {
    const updatedImages = images.filter((_, i) => i !== index);
    if (onImagesChange) {
      onImagesChange(updatedImages);
    }
  };

  // View image full screen
  const viewImage = (image) => {
    setSelectedImage(image);
  };

  // Close image viewer
  const closeImageViewer = () => {
    setSelectedImage(null);
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Render image thumbnail
  const renderImageThumbnail = (image, index) => (
    <View key={index} style={styles.imageContainer}>
      <TouchableOpacity
        style={styles.imageTouchable}
        onPress={() => viewImage(image)}
        activeOpacity={0.8}
      >
        <Image source={{ uri: image.uri }} style={styles.imageThumbnail} />
        <View style={styles.imageOverlay}>
          <Text style={styles.imageSize}>{formatFileSize(image.size)}</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => removeImage(index)}
        activeOpacity={0.7}
      >
        <Text style={styles.removeButtonText}>✕</Text>
      </TouchableOpacity>
    </View>
  );

  // Render add image button
  const renderAddImageButton = () => {
    const canAddMore = images.length < maxImages;

    return (
      <TouchableOpacity
        style={[
          styles.addImageButton,
          !canAddMore && styles.disabledAddButton,
        ]}
        onPress={() => setIsModalVisible(true)}
        disabled={!canAddMore}
        activeOpacity={0.7}
      >
        <Text style={styles.addIcon}>+</Text>
        <Text style={styles.addText}>
          {canAddMore ? 'Add Photo' : `Max ${maxImages} photos`}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>
        {placeholder} ({images.length}/{maxImages})
      </Text>

      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.imagesScrollContainer}
      >
        {images.map(renderImageThumbnail)}
        {renderAddImageButton()}
      </ScrollView>

      {/* Image Picker Modal */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Photo</Text>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={takePhoto}
              activeOpacity={0.7}
            >
              <Text style={styles.modalButtonIcon}>📷</Text>
              <Text style={styles.modalButtonText}>Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={pickFromGallery}
              activeOpacity={0.7}
            >
              <Text style={styles.modalButtonIcon}>🖼️</Text>
              <Text style={styles.modalButtonText}>Choose from Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setIsModalVisible(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Image Viewer Modal */}
      <Modal
        visible={!!selectedImage}
        transparent={true}
        animationType="fade"
        onRequestClose={closeImageViewer}
      >
        <View style={styles.imageViewerOverlay}>
          <TouchableOpacity
            style={styles.closeImageViewer}
            onPress={closeImageViewer}
            activeOpacity={0.7}
          >
            <Text style={styles.closeImageViewerText}>✕</Text>
          </TouchableOpacity>

          {selectedImage && (
            <Image
              source={{ uri: selectedImage.uri }}
              style={styles.fullScreenImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 12,
  },
  imagesScrollContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  imageContainer: {
    marginRight: 12,
    position: 'relative',
  },
  imageTouchable: {
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  imageThumbnail: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: 2,
  },
  imageSize: {
    color: '#FFFFFF',
    fontSize: 10,
    textAlign: 'center',
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E74C3C',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  removeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    lineHeight: 16,
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#4ECDC4',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  disabledAddButton: {
    borderColor: '#BDC3C7',
    backgroundColor: '#F5F7FA',
  },
  addIcon: {
    fontSize: 24,
    color: '#4ECDC4',
    marginBottom: 4,
  },
  addText: {
    fontSize: 12,
    color: '#4ECDC4',
    textAlign: 'center',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 40,
    width: width - 80,
    maxWidth: 320,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: 24,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    marginBottom: 12,
  },
  modalButtonIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  modalButtonText: {
    fontSize: 16,
    color: '#2C3E50',
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#E8F6F5',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#4ECDC4',
    fontWeight: '600',
    textAlign: 'center',
  },
  imageViewerOverlay: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeImageViewer: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  closeImageViewerText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  fullScreenImage: {
    width: width,
    height: height,
  },
});

export default CustomImagePicker;