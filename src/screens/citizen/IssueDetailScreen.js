import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useTranslation } from '../../hooks/useTranslation';

const IssueDetailScreen = () => {
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Issue Details</Text>
        <Text style={styles.subtitle}>This screen will display detailed information about a specific issue.</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#2C3E50', marginBottom: 16 },
  subtitle: { fontSize: 16, color: '#7F8C8D', textAlign: 'center' },
});

export default IssueDetailScreen;