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

export default function RegisterScreen({ navigation }: { navigation: any }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleRegister = async () => {
        if (!email || !password) {
            Alert.alert('Hold on', 'Please enter both an email and a password.');
            return;
        }

        try {
            const response = await fetch('http://10.0.2.2:5000/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                // Show success popup, then automatically route back to Login screen
                Alert.alert(
                    'Success',
                    data.message || 'Account created successfully!',
                    [{ text: 'OK', onPress: () => navigation.goBack() }]
                );
            } else {
                Alert.alert('Registration Failed', data.message || 'Something went wrong.');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Connection Error', 'Cannot reach the server. Make sure your backend is running.');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.innerContainer}
            >
                <View style={styles.headerContainer}>
                    <Text style={styles.title}>Create Account</Text>
                    <Text style={styles.subtitle}>Initialize your secure personal vault.</Text>
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

                    <TouchableOpacity style={styles.button} onPress={handleRegister}>
                        <Text style={styles.buttonText}>Register</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.switchButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={styles.switchText}>Already have an account? <Text style={styles.linkText}>Sign In</Text></Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    innerContainer: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    headerContainer: {
        marginBottom: 40,
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        color: '#ffffff',
        letterSpacing: 0.3,
    },
    subtitle: {
        fontSize: 15,
        color: '#8e8e93',
        marginTop: 8,
    },
    formContainer: {
        width: '100%',
    },
    input: {
        backgroundColor: '#1c1c1e',
        height: 50,
        borderRadius: 12,
        paddingHorizontal: 16,
        color: '#ffffff',
        fontSize: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#2c2c2e',
    },
    button: {
        backgroundColor: '#ffffff',
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
    },
    buttonText: {
        color: '#000000',
        fontSize: 16,
        fontWeight: '600',
    },
    switchButton: {
        alignItems: 'center',
        marginTop: 24,
    },
    switchText: {
        color: '#8e8e93',
        fontSize: 14,
    },
    linkText: {
        color: '#ffffff',
        fontWeight: '600',
    },
});