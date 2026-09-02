import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    ScrollView,
    StatusBar
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api';
import { authenticateUser } from '../utils/biometrics';
import { CustomAlertModal } from '../components/CustomAlertModal';

export default function LoginScreen({ navigation }: { navigation: any }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);
    const [isAuthenticating, setIsAuthenticating] = useState(false);

    // Custom alert modal state
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

    const triggerBiometrics = async () => {
        const token = await AsyncStorage.getItem('userToken');
        if (!token) {
            showAlert(
                'warning',
                'No Stored Session',
                'Please log in with your email and password once. Your session will then be linked to biometrics for instant unlock.'
            );
            return;
        }

        setIsAuthenticating(true);
        try {
            const success = await authenticateUser();
            setIsAuthenticating(false);

            if (success) {
                navigation.replace('Vault');
            }
        } catch (error: any) {
            setIsAuthenticating(false);
            showAlert('error', 'Biometric Error', error?.message || 'Biometric authentication failed.');
        }
    };

    const handleLogin = async () => {
        if (!email || !password) {
            showAlert('warning', 'Hold on', 'Please enter both an email address and a password.');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                await AsyncStorage.setItem('userToken', data.token);
                navigation.replace('Vault');
            } else {
                showAlert('error', 'Login Failed', data.message || 'Invalid credentials.');
            }
        } catch (error) {
            console.error(error);
            showAlert('error', 'Connection Error', 'Cannot reach the server. Make sure your backend server is running.');
        }
    };

    const handleBack = () => {
        if (navigation.canGoBack()) {
            navigation.goBack();
        } else {
            navigation.navigate('Welcome');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Top Pastel Gradient Header Area */}
            <View style={styles.topGradientArea}>
                <View style={styles.ambientBlob1} pointerEvents="none" />
                <View style={styles.ambientBlob2} pointerEvents="none" />

                <TouchableOpacity
                    style={styles.backButton}
                    onPress={handleBack}
                    hitSlop={{ top: 25, bottom: 25, left: 25, right: 25 }}
                    activeOpacity={0.7}
                >
                    <Text style={styles.backButtonText}>‹ Back</Text>
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                    {/* White Curved Bottom Sheet */}
                    <View style={styles.whiteSheet}>
                        
                        {/* Title Header */}
                        <View style={styles.headerContainer}>
                            <Text style={styles.title}>Welcome Back</Text>
                            <Text style={styles.subtitle}>
                                Ready to continue your learning journey?{'\n'}Your path is right here.
                            </Text>
                        </View>

                        {/* Form Input Fields */}
                        <View style={styles.formContainer}>
                            {/* Email Input */}
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    style={styles.cleanInput}
                                    placeholder="Enter email"
                                    placeholderTextColor="#9CA3AF"
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                />
                            </View>

                            {/* Password Input */}
                            <View style={styles.inputWrapper}>
                                <View style={styles.passwordInputContainer}>
                                    <TextInput
                                        style={styles.cleanPasswordInput}
                                        placeholder="Password"
                                        placeholderTextColor="#9CA3AF"
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry={!showPassword}
                                    />
                                    <TouchableOpacity
                                        onPress={() => setShowPassword(!showPassword)}
                                        style={styles.eyeBtn}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '🙈'}</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Log In Soft Gradient Pill Button */}
                            <TouchableOpacity
                                style={styles.gradientPillButton}
                                onPress={handleLogin}
                                activeOpacity={0.88}
                            >
                                <Text style={styles.pillButtonText}>Log In</Text>
                            </TouchableOpacity>

                            {/* Optional Biometric Button */}
                            <TouchableOpacity
                                style={styles.biometricBtn}
                                onPress={triggerBiometrics}
                                disabled={isAuthenticating}
                                activeOpacity={0.8}
                            >
                                {isAuthenticating ? (
                                    <ActivityIndicator size="small" color="#7C3AED" />
                                ) : (
                                    <Text style={styles.biometricText}>🔓 Quick Unlock with Biometrics</Text>
                                )}
                            </TouchableOpacity>

                            {/* Sign Up Link */}
                            <TouchableOpacity
                                style={styles.switchButton}
                                onPress={() => navigation.navigate('Register')}
                            >
                                <Text style={styles.switchText}>
                                    Don't have an account? <Text style={styles.linkText}>Sign Up</Text>
                                </Text>
                            </TouchableOpacity>
                        </View>

                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Custom Alert Modal */}
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#D4C5F9', // Matching upper pastel gradient
    },
    topGradientArea: {
        height: 110,
        backgroundColor: '#D4C5F9',
        justifyContent: 'flex-start',
        paddingHorizontal: 20,
        position: 'relative',
        zIndex: 100,
    },
    ambientBlob1: {
        position: 'absolute',
        top: -40,
        right: -30,
        width: 220,
        height: 220,
        borderRadius: 110,
        backgroundColor: '#C8B6FF',
    },
    ambientBlob2: {
        position: 'absolute',
        top: 20,
        left: -40,
        width: 180,
        height: 180,
        borderRadius: 90,
        backgroundColor: '#FFB8D1',
    },
    backButton: {
        zIndex: 999,
        elevation: 25,
        marginTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 6 : 10,
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.95)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        alignSelf: 'flex-start',
    },
    backButtonText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#4F46E5',
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'flex-end',
    },
    whiteSheet: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 36,
        borderTopRightRadius: 36,
        paddingHorizontal: 24,
        paddingTop: 36,
        paddingBottom: 36,
        minHeight: 580,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.06,
        shadowRadius: 16,
        elevation: 10,
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: 28,
    },
    title: {
        fontSize: 26,
        fontWeight: '800',
        color: '#1E1B4B',
        letterSpacing: -0.5,
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 13,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 19,
    },
    formContainer: {
        width: '100%',
    },
    inputWrapper: {
        marginBottom: 16,
    },
    cleanInput: {
        backgroundColor: '#FFFFFF',
        height: 52,
        borderRadius: 16,
        paddingHorizontal: 18,
        color: '#1E1B4B',
        fontSize: 15,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    passwordInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        height: 52,
        borderRadius: 16,
        paddingHorizontal: 18,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    cleanPasswordInput: {
        flex: 1,
        color: '#1E1B4B',
        fontSize: 15,
        height: '100%',
    },
    eyeBtn: {
        padding: 4,
    },
    eyeIcon: {
        fontSize: 18,
        opacity: 0.7,
    },
    optionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 4,
        marginBottom: 22,
        paddingHorizontal: 2,
    },
    rememberMeRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    checkbox: {
        width: 18,
        height: 18,
        borderRadius: 9,
        borderWidth: 1.5,
        borderColor: '#8B5CF6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
        backgroundColor: '#FFFFFF',
    },
    checkboxChecked: {
        backgroundColor: '#8B5CF6',
    },
    checkmarkText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: 'bold',
        marginTop: -1,
    },
    rememberMeText: {
        fontSize: 13,
        color: '#6B7280',
    },
    forgotText: {
        fontSize: 13,
        color: '#7C3AED',
        fontWeight: '600',
    },
    gradientPillButton: {
        backgroundColor: '#C084FC', // Soft lavender pink gradient tone
        height: 52,
        borderRadius: 26,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#C084FC',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
        elevation: 5,
    },
    pillButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    biometricBtn: {
        alignItems: 'center',
        marginTop: 14,
        paddingVertical: 6,
    },
    biometricText: {
        color: '#7C3AED',
        fontSize: 13,
        fontWeight: '600',
    },
    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 24,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#F1F5F9',
    },
    dividerText: {
        fontSize: 12,
        color: '#94A3B8',
        marginHorizontal: 12,
    },
    socialRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 18,
        marginBottom: 24,
    },
    socialCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    facebookIcon: {
        color: '#1877F2',
        fontSize: 20,
        fontWeight: 'bold',
    },
    googleIcon: {
        color: '#EA4335',
        fontSize: 18,
        fontWeight: 'bold',
    },
    appleIcon: {
        color: '#000000',
        fontSize: 20,
    },
    switchButton: {
        alignItems: 'center',
    },
    switchText: {
        color: '#64748B',
        fontSize: 14,
    },
    linkText: {
        color: '#7C3AED',
        fontWeight: '700',
    },
});