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
  Alert,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import CryptoJS from 'crypto-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SECRET_KEY = 'my-super-secret-vault-key';

export default function VaultScreen({ navigation }: { navigation: any }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [notes, setNotes] = useState<{ id: string, title: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotes = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        navigation.replace('Login');
        return;
      }

      const response = await fetch('http://10.0.2.2:5000/api/notes', {
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
    fetchNotes();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotes();
  };

  const handleSave = async () => {
    if (!title || !content) {
      Alert.alert('Hold on', 'Please fill in both fields.');
      return;
    }

    try {
      // 1. Encrypt locally
      const encryptedContent = CryptoJS.AES.encrypt(content, SECRET_KEY).toString();

      // 2. Fetch the JWT token from storage
      const token = await AsyncStorage.getItem('userToken');

      // 3. Send encrypted data with the authorization token
      const response = await fetch('http://10.0.2.2:5000/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, encryptedContent }),
      });

      const data = await response.json();

      if (response.ok) {
        setNotes([{ id: data._id, title }, ...notes]);
        setTitle('');
        setContent('');
        setModalVisible(false);
      } else {
        Alert.alert('Error', data.message || 'Failed to save note to vault.');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Connection Error', 'Could not reach the server.');
    }
  };

  const handleLogout = async () => {
    // Clear the token on logout to enforce Zero-Trust
    await AsyncStorage.removeItem('userToken');
    navigation.replace('Login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Vault</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color="#ffffff" />
        </View>
      ) : notes.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No items stored yet.</Text>
        </View>
      ) : (
        <FlatList
          data={notes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ffffff" />
          }
          renderItem={({ item }) => (
            <View style={styles.noteCard}>
              <Text style={styles.noteTitle}>{item.title}</Text>
            </View>
          )}
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>New Note</Text>
              <TouchableOpacity onPress={handleSave}>
                <Text style={styles.saveText}>Save</Text>
              </TouchableOpacity>
            </View>

            <TextInput style={styles.inputTitle} placeholder="Title" placeholderTextColor="#8e8e93" value={title} onChangeText={setTitle} />
            <TextInput style={styles.inputContent} placeholder="Secure note content..." placeholderTextColor="#8e8e93" value={content} onChangeText={setContent} multiline autoFocus />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 50,
    paddingBottom: 24
  },
  headerTitle: { fontSize: 32, fontWeight: '700', color: '#ffffff', letterSpacing: 0.3 },
  logoutText: { color: '#ff453a', fontSize: 16, fontWeight: '500' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyStateText: { color: '#8e8e93', fontSize: 16 },
  listContainer: { paddingHorizontal: 24 },
  noteCard: { backgroundColor: '#1c1c1e', padding: 20, borderRadius: 16, marginBottom: 12 },
  noteTitle: { color: '#ffffff', fontSize: 18, fontWeight: '600' },
  fab: { position: 'absolute', bottom: 40, right: 24, width: 60, height: 60, borderRadius: 30, backgroundColor: '#ffffff', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 5 },
  fabText: { fontSize: 32, color: '#000000', fontWeight: '400', marginTop: -4 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  modalContent: { backgroundColor: '#1c1c1e', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, height: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { color: '#ffffff', fontSize: 18, fontWeight: '600' },
  cancelText: { color: '#8e8e93', fontSize: 16 },
  saveText: { color: '#0a84ff', fontSize: 16, fontWeight: '600' },
  inputTitle: { color: '#ffffff', fontSize: 24, fontWeight: '700', marginBottom: 16 },
  inputContent: { color: '#ffffff', fontSize: 16, lineHeight: 24, flex: 1, textAlignVertical: 'top' },
});