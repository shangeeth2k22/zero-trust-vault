import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    TextInput,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    StatusBar,
    Modal
} from 'react-native';
import CryptoJS from 'crypto-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, COLORS } from '../config/api';
import { CustomAlertModal } from '../components/CustomAlertModal';

const SECRET_KEY = 'my-super-secret-vault-key';

export default function NoteDetailScreen({ route, navigation }: any) {
    const { id, title: initialTitle, content: initialEncryptedContent } = route.params;

    const [title, setTitle] = useState(initialTitle || '');
    const [decryptedContent, setDecryptedContent] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(initialTitle || '');
    const [editContent, setEditContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);

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

    // Decrypt content locally on mount
    useEffect(() => {
        if (initialEncryptedContent) {
            try {
                const bytes = CryptoJS.AES.decrypt(initialEncryptedContent, SECRET_KEY);
                const originalText = bytes.toString(CryptoJS.enc.Utf8);
                setDecryptedContent(originalText || '(Empty note)');
                setEditContent(originalText || '');
            } catch (error) {
                console.error('Decryption failed:', error);
                setDecryptedContent('(Failed to decrypt content)');
            }
        }
        setLoading(false);
    }, [initialEncryptedContent]);

    // Delete Note Handler
    const confirmDelete = async () => {
        setDeleting(true);
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await fetch(`${API_BASE_URL}/api/notes/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                setDeleteModalVisible(false);
                navigation.goBack();
            } else {
                const data = await response.json();
                setDeleteModalVisible(false);
                showAlert('error', 'Delete Failed', data.message || 'Failed to delete note.');
            }
        } catch (error) {
            console.error('Delete error:', error);
            setDeleteModalVisible(false);
            showAlert('error', 'Error', 'Could not connect to server.');
        } finally {
            setDeleting(false);
        }
    };

    // Save Edit Handler
    const handleSaveEdit = async () => {
        if (!editTitle.trim() || !editContent.trim()) {
            showAlert('warning', 'Hold on', 'Please fill in both title and content.');
            return;
        }

        setSaving(true);
        try {
            const encryptedContent = CryptoJS.AES.encrypt(editContent, SECRET_KEY).toString();
            const token = await AsyncStorage.getItem('userToken');

            const response = await fetch(`${API_BASE_URL}/api/notes/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: editTitle,
                    encryptedContent
                })
            });

            const data = await response.json();

            if (response.ok) {
                setTitle(editTitle);
                setDecryptedContent(editContent);
                setIsEditing(false);
            } else {
                showAlert('error', 'Update Failed', data.message || 'Could not update note.');
            }
        } catch (error) {
            console.error('Update error:', error);
            showAlert('error', 'Error', 'Could not connect to server.');
        } finally {
            setSaving(false);
        }
    };

    const handleCancelEdit = () => {
        setEditTitle(title);
        setEditContent(decryptedContent);
        setIsEditing(false);
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                {/* Header Actions */}
                <View style={styles.header}>
                    {!isEditing ? (
                        <>
                            <TouchableOpacity
                                onPress={() => navigation.goBack()}
                                hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                                style={styles.backButton}
                                activeOpacity={0.6}
                            >
                                <Text style={styles.backText}>← Vault</Text>
                            </TouchableOpacity>

                            <View style={styles.headerRightActions}>
                                <TouchableOpacity
                                    onPress={() => setIsEditing(true)}
                                    hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                                    style={styles.actionPillEdit}
                                    activeOpacity={0.6}
                                >
                                    <Text style={styles.editText}>Edit</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => setDeleteModalVisible(true)}
                                    hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                                    style={styles.actionPillDelete}
                                    activeOpacity={0.6}
                                >
                                    <Text style={styles.deleteText}>Delete</Text>
                                </TouchableOpacity>
                            </View>
                        </>
                    ) : (
                        <>
                            <TouchableOpacity
                                onPress={handleCancelEdit}
                                hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                                style={styles.backButton}
                                activeOpacity={0.6}
                            >
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={handleSaveEdit}
                                disabled={saving}
                                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                                style={styles.actionPillSave}
                                activeOpacity={0.6}
                            >
                                {saving ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.saveText}>Save</Text>
                                )}
                            </TouchableOpacity>
                        </>
                    )}
                </View>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={COLORS.purplePrimary} />
                    </View>
                ) : !isEditing ? (
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                        
                        {/* Security status badge */}
                        <View style={styles.badgeRow}>
                            <View style={styles.securityBadge}>
                                <Text style={styles.securityBadgeText}>🔒 Decrypted locally • AES-256</Text>
                            </View>
                        </View>

                        <Text style={styles.title}>{title}</Text>

                        <View style={styles.contentCard}>
                            <Text style={styles.content}>{decryptedContent}</Text>
                        </View>
                    </ScrollView>
                ) : (
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                        <View style={styles.badgeRow}>
                            <View style={styles.securityBadgeEdit}>
                                <Text style={styles.securityBadgeEditText}>✏️ Editing Protected Note</Text>
                            </View>
                        </View>

                        <TextInput
                            style={styles.inputTitle}
                            value={editTitle}
                            onChangeText={setEditTitle}
                            placeholder="Note Title"
                            placeholderTextColor="#94A3B8"
                        />

                        <View style={styles.contentCardEdit}>
                            <TextInput
                                style={styles.inputContent}
                                value={editContent}
                                onChangeText={setEditContent}
                                placeholder="Secure note content..."
                                placeholderTextColor="#94A3B8"
                                multiline
                                autoFocus
                            />
                        </View>
                    </ScrollView>
                )}
            </KeyboardAvoidingView>

            {/* Custom Delete Confirmation Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={deleteModalVisible}
                onRequestClose={() => setDeleteModalVisible(false)}
            >
                <View style={styles.centerModalOverlay}>
                    <View style={styles.customAlertCard}>
                        <View style={styles.deleteIconBadge}>
                            <Text style={styles.deleteIcon}>🗑️</Text>
                        </View>

                        <Text style={styles.alertTitle}>Delete Encrypted Note</Text>
                        <Text style={styles.alertSubtitle}>
                            Are you sure you want to permanently delete "{title}" from your vault?
                        </Text>

                        <TouchableOpacity
                            style={styles.deleteDangerButton}
                            onPress={confirmDelete}
                            disabled={deleting}
                            activeOpacity={0.85}
                        >
                            {deleting ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <Text style={styles.deleteDangerText}>Delete Permanently 🗑️</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.alertCancelButton}
                            onPress={() => setDeleteModalVisible(false)}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.alertCancelText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
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
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'android' ? STATUSBAR_HEIGHT + 16 : 16,
        paddingBottom: 16,
        zIndex: 10,
    },
    backButton: {
        paddingVertical: 8,
        paddingHorizontal: 6,
    },
    backText: {
        color: COLORS.purplePrimary,
        fontSize: 17,
        fontWeight: '700',
    },
    headerRightActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionPillEdit: {
        backgroundColor: COLORS.purpleLight,
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 20,
        marginRight: 8,
    },
    editText: {
        color: COLORS.purplePrimary,
        fontSize: 14,
        fontWeight: '700',
    },
    actionPillDelete: {
        backgroundColor: '#FEE2E2',
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 20,
    },
    deleteText: {
        color: COLORS.danger,
        fontSize: 14,
        fontWeight: '700',
    },
    cancelText: {
        color: COLORS.textSecondary,
        fontSize: 16,
        fontWeight: '600',
    },
    actionPillSave: {
        backgroundColor: COLORS.purplePrimary,
        paddingHorizontal: 22,
        paddingVertical: 10,
        borderRadius: 20,
    },
    saveText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    badgeRow: {
        flexDirection: 'row',
        marginBottom: 14,
        marginTop: 6,
    },
    securityBadge: {
        backgroundColor: 'rgba(16, 185, 129, 0.12)',
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 14,
    },
    securityBadgeText: {
        color: COLORS.success,
        fontSize: 12,
        fontWeight: '700',
    },
    securityBadgeEdit: {
        backgroundColor: 'rgba(91, 70, 246, 0.12)',
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 14,
    },
    securityBadgeEditText: {
        color: COLORS.purplePrimary,
        fontSize: 12,
        fontWeight: '700',
    },
    title: {
        color: COLORS.textPrimary,
        fontSize: 30,
        fontWeight: '800',
        letterSpacing: -0.5,
        marginBottom: 16,
    },

    // Solid Clean Card with Minimal Subtle Border & Gentle Shadow
    contentCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 22,
        borderWidth: 1,
        borderColor: 'rgba(226, 232, 240, 0.8)',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
        elevation: 2,
        minHeight: 220,
    },
    content: {
        color: COLORS.textPrimary,
        fontSize: 16,
        lineHeight: 25,
    },

    inputTitle: {
        color: COLORS.textPrimary,
        fontSize: 28,
        fontWeight: '800',
        marginBottom: 16,
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        paddingHorizontal: 18,
        paddingVertical: 14,
        borderWidth: 1,
        borderColor: 'rgba(226, 232, 240, 0.8)',
    },
    contentCardEdit: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 18,
        borderWidth: 1,
        borderColor: 'rgba(226, 232, 240, 0.8)',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
        elevation: 2,
        minHeight: 240,
    },
    inputContent: {
        color: COLORS.textPrimary,
        fontSize: 16,
        lineHeight: 25,
        flex: 1,
        textAlignVertical: 'top',
    },

    // Custom Centered Alert Modal
    centerModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    customAlertCard: {
        backgroundColor: '#FFFFFF',
        width: '100%',
        borderRadius: 28,
        padding: 26,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(226, 232, 240, 0.8)',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 10,
    },
    deleteIconBadge: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#FEE2E2',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    deleteIcon: {
        fontSize: 28,
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
    deleteDangerButton: {
        backgroundColor: COLORS.danger,
        width: '100%',
        height: 52,
        borderRadius: 26,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
        shadowColor: COLORS.danger,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 4,
    },
    deleteDangerText: {
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
});