import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import useStore from '../store/useStore';
import { getStudents, getRecentLogs, getCurrentlyOut } from '../services/api';

export default function AdminDashboardScreen({ navigation }) {
  const user = useStore((s) => s.user);
  const logout = useStore((s) => s.logout);

  // States
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalStudents: 0,
    enrolledFaces: 0,
    currentlyOut: 0,
    currentlyIn: 0,
  });
  const [recentLogs, setRecentLogs] = useState([]);

  // Fetch Dashboard Stats and Logs
  const fetchDashboardData = async () => {
    if (!user?.id) return;
    try {
      // Execute fetches in parallel
      const [studentsRes, outRes, logsRes] = await Promise.all([
        getStudents(user.id),
        getCurrentlyOut(user.id),
        getRecentLogs(user.id),
      ]);

      const studentsList = studentsRes.data || [];
      const outList = outRes.data || [];
      const logsList = logsRes.data || [];

      // Compute statistics
      const totalCount = studentsList.length;
      // Filter enrolled faces (students who have embeddings stored)
      const enrolledCount = studentsList.filter((s) => s.face_embedding !== null).length;
      const outCount = outList.length;
      const inCount = totalCount - outCount;

      setStats({
        totalStudents: totalCount,
        enrolledFaces: enrolledCount,
        currentlyOut: outCount,
        currentlyIn: inCount >= 0 ? inCount : 0,
      });

      setRefreshing(false);
      // Map and slice top 3 recent logs
      setRecentLogs(logsList.slice(0, 3));
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
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

  const getEnrollmentPercentage = () => {
    if (stats.totalStudents === 0) return 0;
    return Math.round((stats.enrolledFaces / stats.totalStudents) * 100);
  };

  const formatLogTime = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return 'Today';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading Dashboard...</Text>
      </View>
    );
  }

  const enrollmentPct = getEnrollmentPercentage();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF8FF" />

      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={handleLogout}>
          <Text style={styles.headerIcon}>🚪</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hostel Biometric</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerButton}>
            <Text style={styles.headerIcon}>🔔</Text>
          </TouchableOpacity>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>A</Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563EB']} />
        }
      >
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>
            Welcome Back, Admin <Text style={styles.handEmoji}>👋</Text>
          </Text>
          <Text style={styles.welcomeSubtitle}>
            {user?.college_name || 'St. Jude Engineering Hostel'}
          </Text>
        </View>

        {/* Stats Grid Stack */}
        <View style={styles.statsStack}>
          {/* Card 1: Total Students */}
          <View style={styles.statsCard}>
            <View style={styles.statsCardHeader}>
              <Text style={styles.statsLabelIcon}>👥</Text>
              <Text style={styles.statsLabel}>Total Students</Text>
            </View>
            <Text style={styles.statsValue}>{stats.totalStudents}</Text>
          </View>

          {/* Card 2: Enrolled Faces */}
          <View style={styles.statsCard}>
            <View style={styles.statsCardHeader}>
              <View style={styles.statsHeaderLeft}>
                <Text style={styles.statsLabelIcon}>👤</Text>
                <Text style={styles.statsLabel}>Enrolled Faces</Text>
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Active</Text>
              </View>
            </View>
            <Text style={styles.statsValue}>{stats.enrolledFaces}</Text>
          </View>

          {/* Card 3: Currently OUT */}
          <View style={styles.statsCard}>
            <View style={styles.statsCardHeader}>
              <Text style={styles.statsLabelIcon}>📤</Text>
              <Text style={styles.statsLabel}>Currently OUT</Text>
            </View>
            <Text style={[styles.statsValue, styles.textOut]}>{stats.currentlyOut}</Text>
          </View>

          {/* Card 4: Currently IN */}
          <View style={styles.statsCard}>
            <View style={styles.statsCardHeader}>
              <Text style={styles.statsLabelIcon}>📥</Text>
              <Text style={styles.statsLabel}>Currently IN</Text>
            </View>
            <Text style={[styles.statsValue, styles.textIn]}>{stats.currentlyIn}</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.sectionHeaderContainer}>
          <Text style={styles.sectionHeader}>Quick Actions</Text>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.primaryActionButton}
            onPress={() => navigation.navigate('RegisterStudent')}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryActionText}>👤+  Register New Student</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryActionButton}
            onPress={() => navigation.navigate('StudentList')}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryActionText}>⚙️  View Roster & Student Profiles</Text>
          </TouchableOpacity>
        </View>

        {/* System Status & Access Logs Card */}
        <View style={styles.systemStatusCard}>
          <Text style={styles.statusCardTitle}>System Status</Text>

          <View style={styles.progressContainer}>
            <View style={styles.progressLabelRow}>
              <Text style={styles.progressLabel}>Enrolled Face Biometrics</Text>
              <Text style={styles.progressPercent}>{enrollmentPct}% complete</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${enrollmentPct}%` }]} />
            </View>
          </View>

          <Text style={styles.recentLogsTitle}>RECENT ACCESS LOGS</Text>

          {recentLogs.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No recent activity logs recorded today.</Text>
            </View>
          ) : (
            recentLogs.map((log) => (
              <View key={log.id} style={styles.logRow}>
                <View style={styles.logProfileContainer}>
                  <Text style={styles.logProfilePlaceholder}>👤</Text>
                </View>
                <View style={styles.logDetails}>
                  <Text style={styles.logName}>
                    {log.students?.full_name || 'Student'} (Room {log.students?.room_number || 'N/A'})
                  </Text>
                  <Text style={styles.logTime}>
                    Today, {formatLogTime(log.timestamp)}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    log.action === 'IN' ? styles.statusBadgeIn : styles.statusBadgeOut,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      log.action === 'IN' ? styles.statusBadgeTextIn : styles.statusBadgeTextOut,
                    ]}
                  >
                    {log.action}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
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
    backgroundColor: '#FAF8FF',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#434655',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },

  // --- Header ---
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: '#E7E7F3',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#004AC6',
    letterSpacing: -0.4,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerIcon: {
    fontSize: 20,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E7E7F3',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#38485d',
  },

  // --- Welcome Section ---
  welcomeSection: {
    marginTop: 24,
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#191B23',
    letterSpacing: -0.48,
    marginBottom: 4,
  },
  handEmoji: {
    fontSize: 22,
  },
  welcomeSubtitle: {
    fontSize: 15,
    color: '#434655',
  },

  // --- Stats Stack ---
  statsStack: {
    gap: 16,
    marginBottom: 28,
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E7E7F3',
    shadowColor: '#191B23',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  statsCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsLabelIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  statsLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#434655',
  },
  statsValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#191B23',
  },
  textOut: {
    color: '#EF4444',
  },
  textIn: {
    color: '#10B981',
  },
  badge: {
    backgroundColor: '#E6F4EA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#137333',
  },

  // --- Quick Actions ---
  sectionHeaderContainer: {
    marginBottom: 16,
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: '700',
    color: '#191B23',
  },
  actionsContainer: {
    gap: 12,
    marginBottom: 28,
  },
  primaryActionButton: {
    height: 52,
    backgroundColor: '#2563EB',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryActionButton: {
    height: 52,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.2)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
  },

  // --- System Status Card ---
  systemStatusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E7E7F3',
    marginBottom: 16,
  },
  statusCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#191B23',
    marginBottom: 16,
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: '#434655',
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#E7E7F3',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#2563EB',
    borderRadius: 4,
  },
  recentLogsTitle: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    color: '#737686',
    marginBottom: 12,
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#FAF8FF',
  },
  logProfileContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E7E7F3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  logProfilePlaceholder: {
    fontSize: 18,
  },
  logDetails: {
    flex: 1,
  },
  logName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#191B23',
    marginBottom: 2,
  },
  logTime: {
    fontSize: 12,
    color: '#737686',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusBadgeIn: {
    backgroundColor: '#E6F4EA',
  },
  statusBadgeOut: {
    backgroundColor: '#FCE8E6',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusBadgeTextIn: {
    color: '#137333',
  },
  statusBadgeTextOut: {
    color: '#C5221F',
  },
  emptyState: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#737686',
    fontSize: 13,
  },
});
