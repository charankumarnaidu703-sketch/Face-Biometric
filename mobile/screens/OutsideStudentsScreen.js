import React, { useState, useEffect, useCallback } from 'react';
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
} from 'react-native';
import { getCurrentlyOut } from '../services/api';
import useStore from '../store/useStore';

export default function OutsideStudentsScreen({ navigation }) {
  const user = useStore((s) => s.user); // Guard user details
  const logout = useStore((s) => s.logout);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOutsideStudents = async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    try {
      const res = await getCurrentlyOut(user.id);
      setStudents(res.data.students || []);
    } catch (err) {
      console.error('Failed to fetch outside students:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOutsideStudents(true);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOutsideStudents(false);
  };

  const handleLogout = async () => {
    await logout();
    navigation.replace('Login');
  };

  const formatOutTime = (isoString) => {
    try {
      const date = new Date(isoString);
      const today = new Date();
      const diffMs = today - date;
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      
      const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      if (diffHours === 0) {
        const diffMins = Math.floor(diffMs / (1000 * 60));
        return `Just now (${timeStr})`;
      } else if (date.toDateString() === today.toDateString()) {
        return `Today at ${timeStr} (${diffHours}h ago)`;
      } else {
        return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} at ${timeStr}`;
      }
    } catch (e) {
      return '';
    }
  };

  const renderStudentItem = ({ item }) => {
    return (
      <View style={styles.studentCard}>
        {/* Left Side: Avatar */}
        <View style={styles.avatarBorder}>
          {item.photo_url ? (
            <Image source={{ uri: item.photo_url }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarPlaceholderText}>
                {item.name
                  ? item.name
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

        {/* Center: Details */}
        <View style={styles.detailsContainer}>
          <Text style={styles.studentName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.studentMeta}>ID: {item.roll_number}  •  Room {item.room_number}</Text>
          <View style={styles.outTimeRow}>
            <Text style={styles.outTimeLabel}>OUT SINCE:</Text>
            <Text style={styles.outTimeValue}>{formatOutTime(item.out_since)}</Text>
          </View>
        </View>

        {/* Right Side: Status dot */}
        <View style={styles.statusDot} />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF8FF" />

      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.7}>
          <Text style={styles.logoutText}>🚪</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Currently Outside</Text>
          <Text style={styles.headerSubtitle}>{students.length} STUDENTS OUT</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>G</Text>
          </View>
        </View>
      </View>

      {/* List content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Updating outside roster...</Text>
        </View>
      ) : (
        <FlatList
          data={students}
          keyExtractor={(item) => item.id}
          renderItem={renderStudentItem}
          contentContainerStyle={styles.listContent}
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
              <Text style={styles.emptyIcon}>🏠</Text>
              <Text style={styles.emptyTitle}>All Students Inside</Text>
              <Text style={styles.emptyText}>
                No students are currently checked out of the hostel gates.
              </Text>
            </View>
          }
        />
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
  logoutText: {
    fontSize: 18,
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
    color: '#F59E0B',
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
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E7E7F3',
    shadowColor: '#191B23',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarBorder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: '#F59E0B',
    padding: 2,
    marginRight: 14,
    overflow: 'hidden',
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
    backgroundColor: '#FFFBEB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholderText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D97706',
  },
  detailsContainer: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#191B23',
    marginBottom: 4,
  },
  studentMeta: {
    fontSize: 12,
    color: '#737686',
    fontWeight: '500',
    marginBottom: 6,
  },
  outTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  outTimeLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#D97706',
    marginRight: 6,
    letterSpacing: 0.5,
  },
  outTimeValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#434655',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F59E0B',
    marginLeft: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#191B23',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#737686',
    textAlign: 'center',
    lineHeight: 20,
  },
});
