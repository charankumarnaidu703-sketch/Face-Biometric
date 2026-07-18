import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
} from 'react-native';

const formatLogDate = (isoString) => {
  if (!isoString) return '';
  let safeStr = isoString;
  if (!safeStr.includes('Z') && !safeStr.includes('+')) {
    safeStr += 'Z';
  }
  try {
    const date = new Date(safeStr);
    return date.toLocaleString();
  } catch (e) {
    return isoString;
  }
};

export default function StudentDetailsModal({ visible, onClose, student, status, time }) {
  if (!student) return null;

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.cardContainer}>
          <View style={styles.innerCard}>
            
            {/* Top Status Pill if applicable */}
            {status && (
              <View style={[styles.statusPill, status === 'OUT' ? styles.statusPillOut : styles.statusPillIn]}>
                <Text style={styles.statusPillText}>
                  {status === 'OUT' ? '🔴 CHECKED OUT' : '🟢 CHECKED IN'}
                </Text>
              </View>
            )}

            {/* Avatar Group */}
            <View style={styles.avatarWrapper}>
              <View style={styles.avatarBorderCircle}>
                {student.photo_url ? (
                  <Image
                    source={{ uri: student.photo_url }}
                    style={styles.avatarImage}
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarPlaceholderText}>
                      {student.name
                        ? student.name
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
            </View>

            {/* Student Info */}
            <Text style={styles.studentName}>{student.name}</Text>
            
            <View style={styles.metaBox}>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Roll No / ID:</Text>
                <Text style={styles.metaValue}>{student.roll_number}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Phone:</Text>
                <Text style={styles.metaValue}>{student.phone || 'N/A'}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Room:</Text>
                <Text style={styles.metaValue}>{student.room_number || 'N/A'}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Branch:</Text>
                <Text style={styles.metaValue}>{student.department || 'N/A'}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Year:</Text>
                <Text style={styles.metaValue}>{student.year ? `${student.year} Year` : 'N/A'}</Text>
              </View>
              {time && (
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Time:</Text>
                  <Text style={styles.metaValue}>{formatLogDate(time)}</Text>
                </View>
              )}
            </View>

            {/* Close Button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.85}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  cardContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: '#E7E7F3',
    padding: 24,
    shadowColor: '#191B23',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 8,
  },
  innerCard: {
    alignItems: 'center',
    width: '100%',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 20,
  },
  statusPillIn: {
    backgroundColor: '#16A34A',
  },
  statusPillOut: {
    backgroundColor: '#DC2626',
  },
  statusPillText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 20,
  },
  avatarBorderCircle: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 3,
    borderColor: '#2563EB',
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 48,
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 48,
    backgroundColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2563EB',
  },
  studentName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#191B23',
    marginBottom: 16,
    textAlign: 'center',
  },
  metaBox: {
    width: '100%',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  metaLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  metaValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '700',
  },
  closeButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
