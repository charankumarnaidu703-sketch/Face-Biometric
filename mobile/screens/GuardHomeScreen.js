import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  ScrollView,
  RefreshControl,
  Platform,
} from 'react-native';
import { getStudentStats, getCurrentlyOut } from '../services/api';
import useStore from '../store/useStore';
import { Ionicons } from '@expo/vector-icons';

export default function GuardHomeScreen({ navigation }) {
  const user = useStore((s) => s.user); // Guard user details
  const logout = useStore((s) => s.logout);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    currentlyOut: 0,
    currentlyIn: 0,
    needToReport: 0,
  });

  const fetchDashboardData = async () => {
    if (!user?.id) return;
    try {
      // Fetch stats and currently-out in parallel — each handles errors independently
      const [statsRes, outRes] = await Promise.allSettled([
        getStudentStats(user.id),
        getCurrentlyOut(user.id),
      ]);

      const statsData = statsRes.status === 'fulfilled' ? statsRes.value.data : {};
      const outData = outRes.status === 'fulfilled' ? outRes.value.data : {};

      const totalCount = statsData.total_students || 0;
      const enrolledCount = statsData.enrolled_faces || 0;
      const outCount = outData.count || 0;
      const inCount = totalCount - outCount;
      
      // "Need to report" = students NOT enrolled yet
      const pendingCount = totalCount - enrolledCount;

      setStats({
        currentlyOut: outCount,
        currentlyIn: inCount >= 0 ? inCount : 0,
        needToReport: pendingCount >= 0 ? pendingCount : 0,
      });
    } catch (err) {
      console.error('Failed to load guard dashboard statistics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboardData();
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigation.replace('Login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF8FF" />

      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.7}>
          <Ionicons name="log-out-outline" size={22} color="#DC2626" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Hostel Biometric</Text>
          <Text style={styles.headerSubtitle}>GUARD GATE STATION</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>G</Text>
          </View>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Loading statistics...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563EB']} />
          }
        >
          {/* Welcome Info */}
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeTitle}>Gate Guard Console</Text>
            <Text style={styles.welcomeSubtitle}>
              {user?.college_name || 'NIT hostel'}
            </Text>
          </View>

          {/* Stats Cards */}
          <View style={styles.statsStack}>
            {/* Card 1: Currently OUT */}
            <View style={[styles.statsCard, styles.cardOut]}>
              <View style={styles.cardHeaderRow}>
                <Ionicons name="exit" size={24} color="#DC2626" />
                <Text style={styles.cardTitle}>Currently OUT</Text>
              </View>
              <Text style={[styles.statsValue, styles.textOut]}>{stats.currentlyOut}</Text>
              <Text style={styles.cardDescription}>Students currently outside the gates</Text>
            </View>

            {/* Card 2: Currently IN */}
            <View style={[styles.statsCard, styles.cardIn]}>
              <View style={styles.cardHeaderRow}>
                <Ionicons name="enter" size={24} color="#16A34A" />
                <Text style={styles.cardTitle}>Inside Hostel</Text>
              </View>
              <Text style={[styles.statsValue, styles.textIn]}>{stats.currentlyIn}</Text>
              <Text style={styles.cardDescription}>Students safe inside the premises</Text>
            </View>

            {/* Card 3: Need to Report */}
            <View style={[styles.statsCard, styles.cardReport]}>
              <View style={styles.cardHeaderRow}>
                <Ionicons name="alert-circle" size={24} color="#F59E0B" />
                <Text style={styles.cardTitle}>Need to Report</Text>
              </View>
              <Text style={[styles.statsValue, styles.textReport]}>{stats.needToReport}</Text>
              <Text style={styles.cardDescription}>Students pending face registration</Text>
            </View>
          </View>

          {/* Shortcuts / Quick Actions */}
          <View style={styles.sectionHeaderContainer}>
            <Text style={styles.sectionHeader}>Quick Actions</Text>
          </View>

          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.primaryActionButton}
              onPress={() => navigation.navigate('ScanTab')}
              activeOpacity={0.85}
            >
              <Ionicons name="camera" size={24} color="#FFFFFF" style={{ marginRight: 10 }} />
              <Text style={styles.primaryActionText}>Launch Scanner Camera</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryActionButton}
              onPress={() => navigation.navigate('OutsideTab')}
              activeOpacity={0.85}
            >
              <Ionicons name="list" size={22} color="#2563EB" style={{ marginRight: 10 }} />
              <Text style={styles.secondaryActionText}>View Checked-Out List</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8FF',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#737686',
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: '#E7E7F3',
    backgroundColor: '#FFFFFF',
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
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#191B23',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  headerRight: {
    width: 40,
    alignItems: 'flex-end',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#2563EB',
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  welcomeSection: {
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#191B23',
    marginBottom: 6,
  },
  welcomeSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#737686',
  },
  statsStack: {
    marginBottom: 28,
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E7E7F3',
    shadowColor: '#191B23',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.02,
    shadowRadius: 12,
    elevation: 3,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#434655',
    marginLeft: 10,
  },
  statsValue: {
    fontSize: 36,
    fontWeight: '900',
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 12,
    color: '#737686',
    fontWeight: '500',
  },
  cardOut: {
    borderLeftWidth: 5,
    borderLeftColor: '#EF4444',
  },
  cardIn: {
    borderLeftWidth: 5,
    borderLeftColor: '#16A34A',
  },
  cardReport: {
    borderLeftWidth: 5,
    borderLeftColor: '#F59E0B',
  },
  textOut: {
    color: '#EF4444',
  },
  textIn: {
    color: '#16A34A',
  },
  textReport: {
    color: '#F59E0B',
  },
  sectionHeaderContainer: {
    marginBottom: 16,
  },
  sectionHeader: {
    fontSize: 17,
    fontWeight: '800',
    color: '#191B23',
    letterSpacing: 0.5,
  },
  actionsContainer: {
    flexDirection: 'column',
  },
  primaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 14,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#2563EB',
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#191B23',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },
  secondaryActionText: {
    color: '#2563EB',
    fontSize: 16,
    fontWeight: '700',
  },
});
