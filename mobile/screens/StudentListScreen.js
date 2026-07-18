import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  RefreshControl,
  Alert,
  Image,
  Platform,
} from 'react-native';
import useStore from '../store/useStore';
import { getStudents } from '../services/api';
import { Ionicons } from '@expo/vector-icons';
import StudentDetailsModal from '../components/StudentDetailsModal';

export default function StudentListScreen({ navigation }) {
  const user = useStore((s) => s.user);

  // States
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Fetch list of students
  const fetchStudents = async () => {
    if (!user?.id) return;
    try {
      const res = await getStudents(user.id);
      setStudents(res.data.students || []);
      setRefreshing(false);
    } catch (err) {
      console.error('Failed to load students roster:', err);
      Alert.alert('Error', 'Unable to fetch student roster.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [user]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStudents();
  }, [user]);

  // Local filtering based on query
  const getFilteredStudents = () => {
    if (!searchQuery.trim()) return students;
    const query = searchQuery.toLowerCase().trim();
    return students.filter(
      (s) =>
        s.name?.toLowerCase().includes(query) ||
        s.roll_number?.toLowerCase().includes(query) ||
        s.room_number?.toLowerCase().includes(query) ||
        s.department?.toLowerCase().includes(query)
    );
  };

  const handleCardPress = (student) => {
    const isEnrolled = student.is_enrolled === true;
    if (!isEnrolled) {
      // Direct shortcut to enrollment camera if they don't have facial biometrics setup
      Alert.alert(
        'Biometric Setup Needed',
        `${student.name} is not enrolled. Set up face biometrics now?`,
        [
          {
            text: 'Enroll Face',
            onPress: () =>
              navigation.navigate('FaceEnrollment', {
                studentId: student.id,
                studentName: student.name,
              }),
          },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    } else {
      setSelectedStudent(student);
      setModalVisible(true);
    }
  };

  const filteredList = getFilteredStudents();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading roster...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF8FF" />

      {/* Top App Bar */}
      <View style={styles.appBar}>
        <TouchableOpacity style={styles.appBarButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back-outline" size={24} color="#191B23" />
        </TouchableOpacity>
        <Text style={styles.appBarTitle}>Roster</Text>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>A</Text>
        </View>
      </View>

      {/* Sticky Search bar container */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color="#737686" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, ID, or room..."
            placeholderTextColor="#C3C6D7"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.totalText}>
          Showing {filteredList.length} students total
        </Text>
      </View>

      {/* Roster Listing */}
      <FlatList
        data={filteredList}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563EB']} />
        }
        renderItem={({ item }) => {
          const isEnrolled = item.is_enrolled === true;
          return (
            <TouchableOpacity
              style={[
                styles.studentCard,
                !isEnrolled && styles.studentCardPending,
              ]}
              onPress={() => handleCardPress(item)}
              activeOpacity={0.85}
            >
              <View style={styles.cardHeader}>
                <View style={styles.avatarCircle}>
                  {item.photo_url ? (
                    <Image source={{ uri: item.photo_url }} style={styles.avatarImage} />
                  ) : (
                    <Ionicons name="person" size={20} color="#737686" />
                  )}
                </View>
                <View style={styles.headerDetails}>
                  <Text style={styles.studentName}>{item.name}</Text>
                  <Text style={styles.studentId}>ID: {item.roll_number}</Text>
                </View>
                {/* Status Badge */}
                <View
                  style={[
                    styles.statusBadge,
                    isEnrolled ? styles.badgeEnrolled : styles.badgePending,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      isEnrolled ? styles.badgeTextEnrolled : styles.badgeTextPending,
                    ]}
                  >
                    {isEnrolled ? 'ENROLLED' : 'PENDING SCAN'}
                  </Text>
                </View>
              </View>

              <View style={styles.cardInfoGrid}>
                {/* Room */}
                <View style={styles.infoBlock}>
                  <Text style={styles.infoLabel}>ROOM</Text>
                  <Text style={styles.infoValue}>
                    {item.room_number || 'Not Assigned'}
                  </Text>
                </View>

                {/* Scan Status */}
                <View style={styles.infoBlock}>
                  {isEnrolled ? (
                    <>
                      <Text style={styles.infoLabel}>STATUS</Text>
                      <Text style={[styles.infoValue, styles.textSuccess]}>Biometrics Set</Text>
                    </>
                  ) : (
                    <>
                      <Text style={[styles.infoLabel, styles.textDanger]}>ACTION REQUIRED</Text>
                      <Text style={[styles.infoValue, styles.textDanger]}>Biometric Setup</Text>
                    </>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              {searchQuery.trim()
                ? 'No students match your search query.'
                : 'No students registered in this hostel roster.'}
            </Text>
          </View>
        }
      />

      <StudentDetailsModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        student={selectedStudent}
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

  // --- AppBar ---
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: '#E7E7F3',
  },
  appBarButton: {
    padding: 8,
  },
  appBarIcon: {
    fontSize: 18,
  },
  appBarTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#191B23',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E7E7F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#38485d',
  },

  // --- Sticky Search Header ---
  searchContainer: {
    paddingHorizontal: 24,
    paddingVertical: 18,
    backgroundColor: 'rgba(250, 248, 255, 0.95)',
    borderBottomWidth: 1,
    borderColor: '#E7E7F3',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderWidth: 1,
    borderColor: '#C3C6D7',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    shadowColor: '#191B23',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#191B23',
  },
  clearIcon: {
    fontSize: 14,
    color: '#737686',
    padding: 4,
  },
  totalText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#434655',
    marginTop: 12,
    marginLeft: 4,
  },

  // --- List Content ---
  listContent: {
    padding: 24,
    paddingBottom: 40,
  },

  // --- Student Card ---
  studentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E7E7F3',
    marginBottom: 16,
    shadowColor: '#191B23',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  studentCardPending: {
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#FAF8FF',
    paddingBottom: 14,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E7E7F3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarTextIcon: {
    fontSize: 20,
  },
  headerDetails: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#191B23',
    marginBottom: 2,
  },
  studentId: {
    fontSize: 13,
    color: '#737686',
  },

  // Badges
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  badgeEnrolled: {
    backgroundColor: '#E6F4EA',
    borderColor: '#A7F3D0',
  },
  badgePending: {
    backgroundColor: '#FCE8E6',
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  badgeTextEnrolled: {
    color: '#137333',
  },
  badgeTextPending: {
    color: '#C5221F',
  },

  // Card Info Grid
  cardInfoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
  },
  infoBlock: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#737686',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '500',
    color: '#191B23',
  },
  textSuccess: {
    color: '#10B981',
  },
  textDanger: {
    color: '#EF4444',
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#737686',
    fontSize: 14,
    textAlign: 'center',
  },
});
