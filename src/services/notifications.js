import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from './api';
import translationService from './translation';

// Notification channel IDs
const NOTIFICATION_CHANNELS = {
  ISSUE_UPDATES: 'issue-updates',
  NEW_MESSAGES: 'new-messages',
  GOVERNMENT_ALERTS: 'government-alerts',
  SYSTEM_NOTIFICATIONS: 'system-notifications',
};

// Storage keys
const STORAGE_KEYS = {
  NOTIFICATION_PERMISSION: 'notification_permission',
  DEVICE_TOKEN: 'device_token',
  LAST_NOTIFICATION_ID: 'last_notification_id',
};

class NotificationService {
  constructor() {
    this.isInitialized = false;
    this.deviceToken = null;
    this.notificationHandlers = new Map();
  }

  // Initialize notifications
  async initialize() {
    if (this.isInitialized) return;

    try {
      // Configure notification handler
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });

      // Request permissions
      await this.requestPermissions();

      // Get device token
      await this.getDeviceToken();

      // Set up notification listeners
      this.setupNotificationListeners();

      this.isInitialized = true;
      console.log('Notification service initialized');
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
    }
  }

  // Request notification permissions
  async requestPermissions() {
    try {
      if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATION_PERMISSION, finalStatus);

        if (finalStatus !== 'granted') {
          console.log('Notification permissions not granted');
          return false;
        }

        // Set up notification channels for Android
        if (Platform.OS === 'android') {
          await this.setupNotificationChannels();
        }

        return true;
      } else {
        console.log('Must use physical device for notifications');
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  // Set up notification channels for Android
  async setupNotificationChannels() {
    if (Platform.OS !== 'android') return;

    try {
      await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.ISSUE_UPDATES, {
        name: 'Issue Updates',
        description: 'Updates on reported civic issues',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        sound: 'default',
        enableLights: true,
        lightColor: '#4ECDC4',
        enableVibrate: true,
      });

      await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.NEW_MESSAGES, {
        name: 'New Messages',
        description: 'New messages from government authorities',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250],
        sound: 'default',
        enableLights: true,
        lightColor: '#FF6B6B',
        enableVibrate: true,
      });

      await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.GOVERNMENT_ALERTS, {
        name: 'Government Alerts',
        description: 'Important alerts from local government',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        sound: 'default',
        enableLights: true,
        lightColor: '#F39C12',
        enableVibrate: true,
      });

      await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.SYSTEM_NOTIFICATIONS, {
        name: 'System Notifications',
        description: 'System-related notifications',
        importance: Notifications.AndroidImportance.LOW,
        sound: 'default',
        enableLights: false,
        enableVibrate: false,
      });
    } catch (error) {
      console.error('Error setting up notification channels:', error);
    }
  }

  // Get device token
  async getDeviceToken() {
    try {
      if (Platform.OS === 'android') {
        const { data: token } = await Notifications.getDevicePushTokenAsync();
        this.deviceToken = token;
      } else if (Platform.OS === 'ios') {
        const { data: token } = await Notifications.getDevicePushTokenAsync({
          experienceId: '@your-organization/your-app', // Replace with your experience ID
        });
        this.deviceToken = token;
      }

      if (this.deviceToken) {
        await AsyncStorage.setItem(STORAGE_KEYS.DEVICE_TOKEN, this.deviceToken);
        console.log('Device token:', this.deviceToken);
      }

      return this.deviceToken;
    } catch (error) {
      console.error('Error getting device token:', error);
      return null;
    }
  }

  // Set up notification listeners
  setupNotificationListeners() {
    // Handle notification received when app is foregrounded
    Notifications.addNotificationReceivedListener(notification => {
      this.handleNotificationReceived(notification);
    });

    // Handle notification response when user taps notification
    Notifications.addNotificationResponseReceivedListener(response => {
      this.handleNotificationResponse(response);
    });
  }

  // Handle notification received
  handleNotificationReceived(notification) {
    console.log('Notification received:', notification);

    const { data } = notification.request.content;
    const handler = this.notificationHandlers.get(data.type);

    if (handler) {
      handler(notification);
    }
  }

  // Handle notification response
  handleNotificationResponse(response) {
    console.log('Notification response:', response);

    const { data } = response.notification.request.content;

    // Handle navigation based on notification type
    switch (data.type) {
      case 'issue_update':
        // Navigate to issue details
        this.navigateToIssue(data.issueId);
        break;
      case 'new_message':
        // Navigate to issue with new message
        this.navigateToIssue(data.issueId);
        break;
      case 'government_alert':
        // Navigate to dashboard or specific screen
        this.navigateToDashboard();
        break;
      default:
        console.log('Unknown notification type:', data.type);
    }
  }

  // Send local notification
  async sendLocalNotification(title, body, data = {}, channelId = NOTIFICATION_CHANNELS.SYSTEM_NOTIFICATIONS) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: {
            ...data,
            type: data.type || 'system',
          },
          sound: 'default',
          priority: Notifications.AndroidPriority.HIGH,
        },
        trigger: null, // Show immediately
        identifier: `local_${Date.now()}`,
      });
    } catch (error) {
      console.error('Error sending local notification:', error);
    }
  }

  // Send issue update notification
  async notifyIssueUpdate(issueId, status, userLanguage = 'en') {
    try {
      const userLanguage = await this.getUserLanguage();
      const title = 'Issue Status Updated';
      const body = translationService.getTemplateMessage('statusUpdate', userLanguage);

      await this.sendLocalNotification(
        title,
        body,
        {
          type: 'issue_update',
          issueId,
          status,
        },
        NOTIFICATION_CHANNELS.ISSUE_UPDATES
      );
    } catch (error) {
      console.error('Error sending issue update notification:', error);
    }
  }

  // Send new message notification
  async notifyNewMessage(issueId, message, senderRole, userLanguage = 'en') {
    try {
      const title = 'New Message';
      const translatedMessage = await translationService.translateForUser(message, 'en');
      const body = `${senderRole}: ${translatedMessage}`;

      await this.sendLocalNotification(
        title,
        body,
        {
          type: 'new_message',
          issueId,
          message,
          senderRole,
        },
        NOTIFICATION_CHANNELS.NEW_MESSAGES
      );
    } catch (error) {
      console.error('Error sending new message notification:', error);
    }
  }

  // Send government alert notification
  async notifyGovernmentAlert(title, message, severity = 'normal') {
    try {
      await this.sendLocalNotification(
        title,
        message,
        {
          type: 'government_alert',
          severity,
        },
        NOTIFICATION_CHANNELS.GOVERNMENT_ALERTS
      );
    } catch (error) {
      console.error('Error sending government alert notification:', error);
    }
  }

  // Register notification handler
  registerNotificationHandler(type, handler) {
    this.notificationHandlers.set(type, handler);
  }

  // Unregister notification handler
  unregisterNotificationHandler(type) {
    this.notificationHandlers.delete(type);
  }

  // Schedule reminder notification
  async scheduleReminder(title, body, triggerTime, data = {}) {
    try {
      const identifier = `reminder_${Date.now()}`;

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: {
            ...data,
            type: 'reminder',
          },
          sound: 'default',
        },
        trigger: {
          date: triggerTime,
        },
        identifier,
      });

      return identifier;
    } catch (error) {
      console.error('Error scheduling reminder:', error);
      return null;
    }
  }

  // Cancel scheduled notification
  async cancelNotification(identifier) {
    try {
      await Notifications.cancelScheduledNotificationAsync(identifier);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  }

  // Get user language (helper method)
  async getUserLanguage() {
    try {
      const language = await AsyncStorage.getItem('janmitra_language');
      return language || 'en';
    } catch (error) {
      console.error('Error getting user language:', error);
      return 'en';
    }
  }

  // Navigation helpers (these would be implemented with your navigation library)
  navigateToIssue(issueId) {
    console.log('Navigate to issue:', issueId);
    // Implementation would depend on your navigation setup
    // navigationRef.current?.navigate('IssueDetail', { issueId });
  }

  navigateToDashboard() {
    console.log('Navigate to dashboard');
    // Implementation would depend on your navigation setup
    // navigationRef.current?.navigate('Dashboard');
  }

  // Get notification permissions status
  async getPermissionsStatus() {
    try {
      const status = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATION_PERMISSION);
      return status || 'undetermined';
    } catch (error) {
      console.error('Error getting permissions status:', error);
      return 'denied';
    }
  }

  // Check if notifications are enabled
  async areNotificationsEnabled() {
    const status = await this.getPermissionsStatus();
    return status === 'granted';
  }

  // Clear all notifications
  async clearAllNotifications() {
    try {
      await Notifications.dismissAllNotificationsAsync();
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  }

  // Get badge count
  async getBadgeCount() {
    try {
      if (Platform.OS === 'ios') {
        const badgeCount = await Notifications.getBadgeCountAsync();
        return badgeCount;
      }
      return 0;
    } catch (error) {
      console.error('Error getting badge count:', error);
      return 0;
    }
  }

  // Set badge count
  async setBadgeCount(count) {
    try {
      if (Platform.OS === 'ios') {
        await Notifications.setBadgeCountAsync(count);
      }
    } catch (error) {
      console.error('Error setting badge count:', error);
    }
  }
}

// Create singleton instance
const notificationService = new NotificationService();

export default notificationService;