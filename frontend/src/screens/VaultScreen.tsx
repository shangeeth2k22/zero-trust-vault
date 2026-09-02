import 'react-native-get-random-values';
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  RefreshControl,
  StatusBar
} from 'react-native';
import CryptoJS from 'crypto-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, COLORS } from '../config/api';
import { authenticateUser, checkBiometricAvailability } from '../utils/biometrics';
import { CustomAlertModal } from '../components/CustomAlertModal';

const SECRET_KEY = 'my-super-secret-vault-key';

export default function VaultScreen({ navigation }: { navigation: any }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [securityModalVisible, setSecurityModalVisible] = useState(false);
  const [selectedNote, setSelectedNote] = useState<{ id: string, title: string, content: string } | null>(null);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [notes, setNotes] = useState<{ id: string, title: string, content: string }[]>([]);
  const [lockedNoteIds, setLockedNoteIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'unlocked' | 'locked'>('unlocked');

  // Custom Alert Modal state
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    buttonText?: string;
    onConfirm: () => void;
  }>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const showAlert = (
    type: 'success' | 'error' | 'warning' | 'info',
    title: string,
    message: string,
    buttonText = 'OK',
    onConfirmAction?: () => void
  ) => {
    setAlertConfig({
      visible: true,
      type,
      title,
      message,
      buttonText,
      onConfirm: () => {
        setAlertConfig(prev => ({ ...prev, visible: false }));
        if (onConfirmAction) onConfirmAction();
      },
    });
  };

  // Load stored locked note IDs from AsyncStorage
  const loadLockedNoteIds = async () => {
    try {
      const stored = await AsyncStorage.getItem('lockedNoteIds');
      if (stored) {
        setLockedNoteIds(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Error loading lockedNoteIds:', e);
    }
  };

  // Save locked note IDs to AsyncStorage
  const saveLockedNoteIds = async (ids: string[]) => {
    try {
      setLockedNoteIds(ids);
      await AsyncStorage.setItem('lockedNoteIds', JSON.stringify(ids));
    } catch (e) {
      console.error('Error saving lockedNoteIds:', e);
    }
  };

  const fetchNotes = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        navigation.replace('Login');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/notes`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && Array.isArray(data)) {
        const formattedNotes = data.map((item: any) => ({
          id: item._id || item.id,
          title: item.title,
          content: item.encryptedContent
        }));
        setNotes(formattedNotes);
      } else {
        console.error('Fetch notes error:', data.message);
      }
    } catch (error) {
      console.error('Connection error while fetching notes:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadLockedNoteIds();
    fetchNotes();
    const unsubscribe = navigation.addListener('focus', () => {
      loadLockedNoteIds();
      fetchNotes();
    });
    return unsubscribe;
  }, [navigation]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotes();
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      showAlert('warning', 'Hold on', 'Please fill in both title and content fields.');
      return;
    }

    try {
      const encryptedContent = CryptoJS.AES.encrypt(content, SECRET_KEY).toString();
      const token = await AsyncStorage.getItem('userToken');

      const response = await fetch(`${API_BASE_URL}/api/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, encryptedContent }),
      });

      const data = await response.json();

      if (response.ok) {
        setNotes([{ id: data._id, title, content: encryptedContent }, ...notes]);
        setTitle('');
        setContent('');
        setModalVisible(false);
      } else {
        showAlert('error', 'Error', data.message || 'Failed to save note to vault.');
      }
    } catch (error) {
      console.error(error);
      showAlert('error', 'Connection Error', 'Could not reach the server.');
    }
  };

  const handleLogout = async () => {
    navigation.replace('Login');
  };

  // Toggle lock state for a single note item
  const toggleItemLock = async (item: { id: string, title: string, content: string }, e: any) => {
    e.stopPropagation();
    const isLocked = lockedNoteIds.includes(item.id);

    if (isLocked) {
      const authenticated = await authenticateUser();
      if (authenticated) {
        const updated = lockedNoteIds.filter(id => id !== item.id);
        await saveLockedNoteIds(updated);
      } else {
        setSelectedNote(item);
        setSecurityModalVisible(true);
      }
    } else {
      const updated = [...lockedNoteIds, item.id];
      await saveLockedNoteIds(updated);
    }
  };

  // Handle Note Item Press (to view note)
  const handleItemPress = async (item: { id: string, title: string, content: string }) => {
    const isLocked = lockedNoteIds.includes(item.id);
    if (isLocked) {
      setSelectedNote(item);
      const authenticated = await authenticateUser();
      if (authenticated) {
        navigation.navigate('NoteDetail', { id: item.id, title: item.title, content: item.content });
      } else {
        setSecurityModalVisible(true);
      }
    } else {
      navigation.navigate('NoteDetail', { id: item.id, title: item.title, content: item.content });
    }
  };

  // Retry biometric auth from Custom Modal
  const handleRetryAuth = async () => {
    if (!selectedNote) return;
    setSecurityModalVisible(false);
    const authenticated = await authenticateUser();
    if (authenticated) {
      const updated = lockedNoteIds.filter(id => id !== selectedNote.id);
      await saveLockedNoteIds(updated);
      navigation.navigate('NoteDetail', { id: selectedNote.id, title: selectedNote.title, content: selectedNote.content });
    }
  };

  const unlockedNotes = notes.filter(n => !lockedNoteIds.includes(n.id));
  const lockedNotes = notes.filter(n => lockedNoteIds.includes(n.id));
  const displayedNotes = activeTab === 'unlocked' ? unlockedNotes : lockedNotes;

  const cardColors = ['#10B981', '#5B46F6', '#3B82F6', '#F59E0B', '#EC4899', '#8B5CF6'];

  const renderListHeader = () => (
    <View style={styles.headerComponentContainer}>
      
      {/* Top Welcome Title & Actions */}
      <View style={styles.topGreetingBar}>
        <View>
          <Text style={styles.greetingTitle}>Hello User</Text>
          <Text style={styles.greetingSubtitle}>Protect your privacy</Text>
        </View>

        <View style={styles.topActionsRow}>
          <View style={styles.glassDiamondBadge}>
            <Text style={styles.diamondIcon}>💎</Text>
          </View>

          <TouchableOpacity style={styles.logoutGlassPill} onPress={handleLogout} activeOpacity={0.8}>
            <Text style={styles.logoutPillText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Glassmorphism Hero Card */}
      <View style={styles.glassHeroCard}>
        <View style={styles.heroCardContent}>
          <Text style={styles.heroCardTitle}>Zero-Trust Vault</Text>
          <Text style={styles.heroCardSubtitle}>
            {`Total: ${notes.length} Vault Items`}
          </Text>

          <View style={styles.heroStatusRow}>
            <View style={styles.glassHeroBadge}>
              <Text style={styles.heroBadgeText}>
                {`🔓 ${unlockedNotes.length} Unlocked  •  🔒 ${lockedNotes.length} Locked`}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.glassHeroLockCircle}>
          <Text style={styles.heroLockIcon}>{lockedNotes.length > 0 ? '🔒' : '🔓'}</Text>
        </View>
      </View>

      {/* Vault Items Section Header & Tab Pills */}
      <View style={styles.vaultSectionHeader}>
        <Text style={styles.sectionHeaderTitle}>Vault Items</Text>

        <View style={styles.glassTabContainer}>
          <TouchableOpacity
            style={[styles.tabPill, activeTab === 'unlocked' && styles.tabPillActive]}
            onPress={() => setActiveTab('unlocked')}
            activeOpacity={0.85}
          >
            <Text style={[styles.tabPillText, activeTab === 'unlocked' && styles.tabPillTextActive]}>
              Unlocked
            </Text>
            <View style={[
              styles.countBadgeCircle,
              activeTab === 'unlocked' ? styles.countBadgeActive : styles.countBadgeUnlockedInactive
            ]}>
              <Text style={[
                styles.countBadgeText,
                activeTab === 'unlocked' ? styles.countBadgeTextActive : styles.countBadgeTextUnlockedInactive
              ]}>
                {unlockedNotes.length}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabPill, activeTab === 'locked' && styles.tabPillActive]}
            onPress={() => setActiveTab('locked')}
            activeOpacity={0.85}
          >
            <Text style={[styles.tabPillText, activeTab === 'locked' && styles.tabPillTextActive]}>
              Locked
            </Text>
            <View style={[
              styles.countBadgeCircle,
              activeTab === 'locked' ? styles.countBadgeActive : styles.countBadgeLockedInactive
            ]}>
              <Text style={[
                styles.countBadgeText,
                activeTab === 'locked' ? styles.countBadgeTextActive : styles.countBadgeTextLockedInactive
              ]}>
                {lockedNotes.length}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.ambientBlob1} />
      <View style={styles.ambientBlob2} />

      {loading ? (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color={COLORS.purplePrimary} />
        </View>
      ) : (
        <FlatList
          data={displayedNotes}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderListHeader}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.purplePrimary} />
          }
          ListEmptyComponent={
            <View style={styles.glassEmptyStateCard}>
              <Text style={styles.emptyStateIcon}>{activeTab === 'unlocked' ? '🔓' : '🔒'}</Text>
              <Text style={styles.emptyStateText}>
                {activeTab === 'unlocked' ? 'No unlocked items.' : 'No locked items.'}
              </Text>
              <Text style={styles.emptyStateSubtext}>
                {activeTab === 'unlocked'
                  ? 'Tap the 🔒 badge on any item to lock it.'
                  : 'Tap the 🔓 badge on any unlocked item to lock it here.'}
              </Text>
            </View>
          }
          renderItem={({ item, index }) => {
            const iconBg = cardColors[index % cardColors.length];
            const isLocked = lockedNoteIds.includes(item.id);

            return (
              <TouchableOpacity
                style={[styles.glassNoteCard, isLocked && styles.glassNoteCardLocked]}
                onPress={() => handleItemPress(item)}
                activeOpacity={0.8}
              >
                <View style={[styles.noteIconContainer, { backgroundColor: iconBg }]}>
                  <Text style={styles.noteIconText}>📝</Text>
                </View>

                <View style={styles.noteTextContent}>
                  <Text style={styles.noteTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={[styles.noteSubtitle, isLocked && styles.noteSubtitleLocked]}>
                    {isLocked ? 'Locked • Tap badge to Unlock' : 'Unlocked • Tap badge to Lock'}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.glassLockBadge, isLocked ? styles.lockBadgeLocked : styles.lockBadgeUnlocked]}
                  onPress={(e) => toggleItemLock(item, e)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={styles.lockBadgeIcon}>{isLocked ? '🔒' : '🔓'}</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Floating Action Button (FAB) */}
      <TouchableOpacity
        style={styles.glassFab}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.85}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Custom Security Challenge Glass Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={securityModalVisible}
        onRequestClose={() => setSecurityModalVisible(false)}
      >
        <View style={styles.centerModalOverlay}>
          <View style={styles.glassAlertCard}>
            <View style={styles.alertIconBadge}>
              <Text style={styles.alertIcon}>🔒</Text>
            </View>

            <Text style={styles.alertTitle}>Vault Item Locked</Text>
            <Text style={styles.alertSubtitle}>
              Biometric authentication is required to unlock and view "{selectedNote?.title}".
            </Text>

            <TouchableOpacity
              style={styles.alertPrimaryButton}
              onPress={handleRetryAuth}
              activeOpacity={0.85}
            >
              <Text style={styles.alertPrimaryText}>Authenticate Now 🔓</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.alertCancelButton}
              onPress={() => setSecurityModalVisible(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.alertCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Slide-Up Create Note Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.glassModalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setModalVisible(false)} activeOpacity={0.7}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>New Encrypted Note</Text>
              <TouchableOpacity onPress={handleSave} activeOpacity={0.7}>
                <Text style={styles.saveText}>Save</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.glassInputTitle}
              placeholder="Note Title"
              placeholderTextColor="#94A3B8"
              value={title}
              onChangeText={setTitle}
            />

            <TextInput
              style={styles.glassInputContent}
              placeholder="Write your secret content here... It will be encrypted locally using AES-256 before leaving your device."
              placeholderTextColor="#94A3B8"
              value={content}
              onChangeText={setContent}
              multiline
              autoFocus
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Custom Modern Alert Modal */}
      <CustomAlertModal
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        buttonText={alertConfig.buttonText}
        onConfirm={alertConfig.onConfirm}
      />
    </SafeAreaView>
  );
}

const STATUSBAR_HEIGHT = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgLight,
    position: 'relative',
  },
  ambientBlob1: {
    position: 'absolute',
    top: 60,
    right: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(91, 70, 246, 0.15)',
  },
  ambientBlob2: {
    position: 'absolute',
    bottom: 120,
    left: -50,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 100,
  },
  headerComponentContainer: {
    marginBottom: 16,
  },
  topGreetingBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: Platform.OS === 'android' ? STATUSBAR_HEIGHT + 10 : 10,
  },
  greetingTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  greetingSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  topActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  glassDiamondBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  diamondIcon: {
    fontSize: 18,
  },
  logoutGlassPill: {
    backgroundColor: 'rgba(254, 226, 226, 0.85)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  logoutPillText: {
    color: COLORS.danger,
    fontSize: 13,
    fontWeight: '700',
  },

  // Hero Card
  glassHeroCard: {
    backgroundColor: COLORS.glassHeroBg,
    borderRadius: 26,
    padding: 22,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1.5,
    borderColor: COLORS.glassHeroBorder,
    shadowColor: COLORS.purpleHero,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  heroCardContent: {
    flex: 1,
  },
  heroCardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  heroCardSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 14,
  },
  heroStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  glassHeroBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  heroBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  glassHeroLockCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  heroLockIcon: {
    fontSize: 24,
  },

  sectionHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 14,
  },

  vaultSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  glassTabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderRadius: 20,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
  },
  tabPillActive: {
    backgroundColor: COLORS.purplePrimary,
  },
  tabPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  tabPillTextActive: {
    color: '#FFFFFF',
  },
  countBadgeCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 7,
  },
  countBadgeActive: {
    backgroundColor: '#FFFFFF',
  },
  countBadgeUnlockedInactive: {
    backgroundColor: 'rgba(16, 185, 129, 0.16)',
  },
  countBadgeLockedInactive: {
    backgroundColor: 'rgba(239, 68, 68, 0.16)',
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  countBadgeTextActive: {
    color: COLORS.purplePrimary,
  },
  countBadgeTextUnlockedInactive: {
    color: COLORS.success,
  },
  countBadgeTextLockedInactive: {
    color: COLORS.danger,
  },

  // Note Cards List
  glassNoteCard: {
    backgroundColor: COLORS.glassBg,
    borderRadius: 22,
    padding: 16,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.glassBorder,
    shadowColor: '#372BAC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 4,
  },
  glassNoteCardLocked: {
    borderColor: 'rgba(91, 70, 246, 0.35)',
    backgroundColor: 'rgba(250, 249, 255, 0.85)',
  },
  noteIconContainer: {
    width: 46,
    height: 46,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  noteIconText: {
    fontSize: 20,
  },
  noteTextContent: {
    flex: 1,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 3,
  },
  noteSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  noteSubtitleLocked: {
    color: COLORS.purplePrimary,
    fontWeight: '600',
  },
  glassLockBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.7)',
  },
  lockBadgeUnlocked: {
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
  },
  lockBadgeLocked: {
    backgroundColor: 'rgba(239, 68, 68, 0.14)',
  },
  lockBadgeIcon: {
    fontSize: 15,
  },

  // Empty State
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  glassEmptyStateCard: {
    backgroundColor: COLORS.glassBg,
    borderRadius: 22,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.glassBorder,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  emptyStateIcon: { fontSize: 40, marginBottom: 12 },
  emptyStateText: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  emptyStateSubtext: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center' },

  // Floating Action Button (FAB)
  glassFab: {
    position: 'absolute',
    bottom: 34,
    right: 24,
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: COLORS.purplePrimary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    shadowColor: COLORS.purplePrimary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.38,
    shadowRadius: 12,
    elevation: 7,
  },
  fabText: {
    fontSize: 34,
    color: '#FFFFFF',
    fontWeight: '400',
    marginTop: -4,
  },

  // Custom Centered Security Challenge Glass Modal
  centerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  glassAlertCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    width: '100%',
    borderRadius: 28,
    padding: 26,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: COLORS.purplePrimary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  alertIconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(91, 70, 246, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(91, 70, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  alertIcon: {
    fontSize: 30,
  },
  alertTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  alertSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  alertPrimaryButton: {
    backgroundColor: COLORS.purplePrimary,
    width: '100%',
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: COLORS.purplePrimary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  alertPrimaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  alertCancelButton: {
    width: '100%',
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertCancelText: {
    color: COLORS.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
  },
  glassModalContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    height: '85%',
    borderWidth: 1.5,
    borderColor: COLORS.glassBorder,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  cancelText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: '500',
  },
  saveText: {
    color: COLORS.purplePrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  glassInputTitle: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  glassInputContent: {
    color: COLORS.textPrimary,
    fontSize: 16,
    lineHeight: 24,
    flex: 1,
    textAlignVertical: 'top',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
});