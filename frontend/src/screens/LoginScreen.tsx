import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen({ navigation }: { navigation: any }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Hold on', 'Please enter both an email and a password.');
            return;
        }

        try {
            const response = await fetch('http://10.0.2.2:5000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                // Save the token securely to device storage
                await AsyncStorage.setItem('userToken', data.token);
                navigation.replace('Vault');
            } else {
                Alert.alert('Login Failed', data.message || 'Invalid credentials.');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Connection Error', 'Cannot reach the server.');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.innerContainer}
            >
                <View style={styles.headerContainer}>
                    <Text style={styles.title}>Access Vault</Text>
                    <Text style={styles.subtitle}>Enter your credentials to unlock.</Text>
                </View>

                <View style={styles.formContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Email address"
                        placeholderTextColor="#8e8e93"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Password"
                        placeholderTextColor="#8e8e93"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />
                    <TouchableOpacity style={styles.button} onPress={handleLogin}>
                        <Text style={styles.buttonText}>Log In</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.switchButton}
                        onPress={() => navigation.navigate('Register')}
                    >
                        <Text style={styles.switchText}>Need an account? <Text style={styles.linkText}>Register</Text></Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000000' },
    innerContainer: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
    headerContainer: { marginBottom: 40 },
    title: { fontSize: 32, fontWeight: '700', color: '#ffffff', letterSpacing: 0.3 },
    subtitle: { fontSize: 15, color: '#8e8e93', marginTop: 8 },
    formContainer: { width: '100%' },
    input: { backgroundColor: '#1c1c1e', height: 50, borderRadius: 12, paddingHorizontal: 16, color: '#ffffff', fontSize: 16, marginBottom: 16, borderWidth: 1, borderColor: '#2c2c2e' },
    button: { backgroundColor: '#ffffff', height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
    buttonText: { color: '#000000', fontSize: 16, fontWeight: '600' },
    switchButton: { alignItems: 'center', marginTop: 24 },
    switchText: { color: '#8e8e93', fontSize: 14 },
    linkText: { color: '#ffffff', fontWeight: '600' },
});