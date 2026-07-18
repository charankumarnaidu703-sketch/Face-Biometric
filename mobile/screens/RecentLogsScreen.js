import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  RefreshControl,
  Image,
  Platform,
  Alert,
} from 'react-native';
import { getRecentLogs } from '../services/api';
import useStore from '../store/useStore';
import { Ionicons } from '@expo/vector-icons';
import StudentDetailsModal from '../components/StudentDetailsModal';

export default function RecentLogsScreen({ navigation }) {
  const user = useStore((s) => s.user); // Guard user details
  const logout = useStore((s) => s.logout);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('IN'); // 'IN' or 'OUT'
  const [selectedLog, setSelectedLog] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const handleLogPress = (item) => {
    setSelectedLog(item);
    setModalVisible(true);
  };

  const handleLogout = async () => {
    await logout();
    navigation.replace('Login');
  };

  const fetchLogs = async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    try {
      // In guard role, we query using user.id (which points to the linked admin/creator id)
      // If user.role is guard, user.id links to their supervisor admin.
      const res = await getRecentLogs(user.id);
      setLogs(res.data.logs || []);
    } catch (err) {
      console.error('Failed to fetch activity logs:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs(true);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchLogs(false);
  };

  const formatLogDate = (isoString) => {
    try {
      let safeStr = isoString;
      if (safeStr && !safeStr.includes('Z') && !safeStr.includes('+')) {
        safeStr += 'Z';
      }
      const date = new Date(safeStr);
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);

      if (date.toDateString() === today.toDateString()) {
        return 'TODAY';
      } else if (date.toDateString() === yesterday.toDateString()) {
        return 'YESTERDAY';
      } else {
        return date.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        }).toUpperCase();
      }
    } catch (e) {
      return 'RECENT';
    }
  };

  const formatTime = (isoString) => {
    try {
      let safeStr = isoString;
      if (safeStr && !safeStr.includes('Z') && !safeStr.includes('+')) {
        safeStr += 'Z';
      }
      const date = new Date(safeStr);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  // Group logs by date dynamically for sections
  const groupLogsByDate = (logList) => {
    const groups = {};
    logList.forEach((log) => {
      const dateHeader = formatLogDate(log.timestamp);
      if (!groups[dateHeader]) {
        groups[dateHeader] = [];
      }
      groups[dateHeader].push(log);
    });

    // Flatten to a single list with section header items
    const flattenedList = [];
    Object.keys(groups).forEach((dateHeader) => {
      flattenedList.push({ isHeader: true, title: dateHeader });
      groups[dateHeader].forEach((log) => {
        flattenedList.push({ ...log, isHeader: false });
      });
    });
    return flattenedList;
  };

  const renderItem = ({ item }) => {
    if (item.isHeader) {
      return (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{item.title}</Text>
        </View>
      );
    }

    const isOut = item.action === 'OUT';
    const timeText = formatTime(item.timestamp);
    const gateLabel = item.gate === 'MAIN_GATE' ? 'Biometric Gate A' : 'Biometric Gate B';

    return (
      <TouchableOpacity style={styles.logCard} onPress={() => handleLogPress(item)} activeOpacity={0.75}>
        {/* Left Side: Student Avatar with red/green status border */}
        <View
          style={[
            styles.avatarBorder,
            { borderColor: isOut ? '#DC2626' : '#16A34A' },
          ]}
        >
          {item.students?.photo_url ? (
            <Image source={{ uri: item.students.photo_url }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarPlaceholderText}>
                {item.students?.name
                  ? item.students.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)
                  : 'ST'}
              </Text>
            </View>
          )}
        </View>

        {/* Center: Student Name & Room details */}
        <View style={styles.logDetails}>
          <Text style={styles.studentName} numberOfLines={1}>
            {item.students?.name || 'Unknown Student'}
          </Text>
          <Text style={styles.studentSub} numberOfLines={1}>
            {item.students?.roll_number ? `${item.students.roll_number} • Room ${item.students.room_number || 'N/A'}` : gateLabel}
          </Text>
        </View>

        {/* Right Side: Timestamp & Status badge */}
        <View style={styles.logStatus}>
          <Text style={styles.timestampText}>{timeText}</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: isOut ? 'rgba(220, 38, 38, 0.1)' : 'rgba(22, 163, 74, 0.1)' },
            ]}
          >
            <Text style={[styles.statusBadgeText, { color: isOut ? '#DC2626' : '#16A34A' }]}>
              {isOut ? 'CHECKED OUT' : 'CHECKED IN'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const filteredLogs = logs.filter((log) => log.action?.toUpperCase() === activeFilter);
  const flattenedData = groupLogsByDate(filteredLogs);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF8FF" />

      {/* Top Header Bar */}
      <View style={styles.headerBar}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.menuButton} onPress={handleLogout} activeOpacity={0.7}>
            <Ionicons name="log-out-outline" size={22} color="#DC2626" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Hostel Biometric</Text>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {user?.full_name
                ? user.full_name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)
                : 'G'}
            </Text>
          </View>
        </View>
      </View>

      {/* Main Title Row */}
      <View style={styles.titleRow}>
        <View>
          <Text style={styles.screenTitle}>Access Logs</Text>
          <Text style={styles.subTitle}>REAL-TIME AUDIT LOGS</Text>
        </View>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={() => fetchLogs(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="refresh-outline" size={20} color="#2563EB" />
        </TouchableOpacity>
      </View>

      {/* Toggle Segment Controls */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleButton, activeFilter === 'IN' && styles.toggleButtonActive]}
          onPress={() => setActiveFilter('IN')}
          activeOpacity={0.8}
        >
          <Ionicons 
            name="enter-outline" 
            size={18} 
            color={activeFilter === 'IN' ? '#FFFFFF' : '#737686'} 
            style={{ marginRight: 6 }} 
          />
          <Text style={[styles.toggleButtonText, activeFilter === 'IN' && styles.toggleButtonTextActive]}>
            Checked In
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toggleButton, activeFilter === 'OUT' && styles.toggleButtonActive]}
          onPress={() => setActiveFilter('OUT')}
          activeOpacity={0.8}
        >
          <Ionicons 
            name="exit-outline" 
            size={18} 
            color={activeFilter === 'OUT' ? '#FFFFFF' : '#737686'} 
            style={{ marginRight: 6 }} 
          />
          <Text style={[styles.toggleButtonText, activeFilter === 'OUT' && styles.toggleButtonTextActive]}>
            Checked Out
          </Text>
        </TouchableOpacity>
      </View>

      {/* Roster Logs List */}
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loaderText}>Loading logs history...</Text>
        </View>
      ) : (
        <FlatList
          data={flattenedData}
          keyExtractor={(item, index) => item.isHeader ? `h-${item.title}` : `log-${item.id}-${index}`}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#2563EB']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyTitle}>No Activity Logs Yet</Text>
              <Text style={styles.emptySubtitle}>
                Verification check-in/check-out outpasses will appear here after student face scans are logged.
              </Text>
            </View>
          }
        />
      )}

      <StudentDetailsModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        student={selectedLog?.students}
        status={selectedLog?.action}
        time={selectedLog?.timestamp}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8FF',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  headerBar: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: '#E7E7F3',
    paddingBottom: 12,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  menuButton: {
    padding: 4,
  },
  menuIcon: {
    fontSize: 20,
    color: '#191B23',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2563EB',
    letterSpacing: 0.3,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
  },
  subTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#737686',
    letterSpacing: 0.8,
    marginTop: 2,
  },

  // ─── Title and Refresh ─────────────────────────────────────────
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 16,
  },
  toggleContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 18,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderRadius: 10,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#E7E7F3',
  },
  toggleButtonActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  toggleButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#737686',
  },
  toggleButtonTextActive: {
    color: '#FFFFFF',
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#191B23',
    letterSpacing: 0.2,
  },
  refreshButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E7E7F3',
    shadowColor: '#191B23',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  refreshIcon: {
    fontSize: 16,
  },

  // ─── Section Header ────────────────────────────────────────────
  sectionHeader: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#737686',
    letterSpacing: 1.2,
  },

  // ─── Log Card Layout ───────────────────────────────────────────
  listContainer: {
    paddingBottom: 32,
  },
  logCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E7E7F3',
    shadowColor: '#191B23',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 2,
  },
  avatarBorder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    padding: 2.5,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginRight: 16,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4B5563',
  },
  logDetails: {
    flex: 1,
    marginRight: 8,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#191B23',
    marginBottom: 4,
  },
  studentSub: {
    fontSize: 13,
    color: '#737686',
    fontWeight: '500',
  },
  logStatus: {
    alignItems: 'flex-end',
  },
  timestampText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#191B23',
    marginBottom: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // ─── Loading and Empty States ──────────────────────────────────
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loaderText: {
    marginTop: 12,
    color: '#737686',
    fontSize: 15,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 80,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#191B23',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#737686',
    textAlign: 'center',
    lineHeight: 22,
  },
});
