import React from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    SafeAreaView,
    Image,
    Dimensions,
    Platform,
    StatusBar
} from 'react-native';

const { width } = Dimensions.get('window');

export default function WelcomeScreen({ navigation }: { navigation: any }) {
    return (
        <SafeAreaView style={styles.container}>
            {/* Background Decorative Wavy Blobs */}
            <View style={styles.bgGradientBlobTop} />
            <View style={styles.bgGradientBlobBottom} />

            <View style={styles.content}>
                {/* Header Section */}
                <View style={styles.header}>
                    <Text style={styles.title}>Welcome</Text>
                </View>

                {/* Illustration Section */}
                <View style={styles.illustrationContainer}>
                    <Image
                        source={require('../assets/clean_lock.jpg')}
                        style={styles.illustration}
                        resizeMode="contain"
                    />
                </View>

                {/* Actions Section */}
                <View style={styles.actionsContainer}>
                    <TouchableOpacity
                        style={styles.createAccountBtn}
                        onPress={() => navigation.navigate('Register')}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.createAccountText}>Create Account</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.loginBtn}
                        onPress={() => navigation.navigate('Login')}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.loginText}>Log In</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#C5B5F8', // Matches lock image background for seamless floating effect
        position: 'relative',
    },
    bgGradientBlobTop: {
        position: 'absolute',
        top: -60,
        right: -40,
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: '#C8B6FF',
    },
    bgGradientBlobBottom: {
        position: 'absolute',
        bottom: -80,
        left: -60,
        width: 360,
        height: 360,
        borderRadius: 180,
        backgroundColor: '#FFB8D1',
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 16 : 24,
        paddingBottom: 24,
        justifyContent: 'space-between',
    },
    header: {
        alignItems: 'center',
        marginTop: 36,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: '#1E1B4B',
        letterSpacing: -0.5,
        textAlign: 'center',
    },
    illustrationContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 10,
    },
    illustration: {
        width: 250,
        height: 250,
    },
    actionsContainer: {
        width: '100%',
        gap: 14,
        marginBottom: 20,
    },
    createAccountBtn: {
        backgroundColor: '#FFFFFF',
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
    },
    createAccountText: {
        color: '#1E1B4B',
        fontSize: 16,
        fontWeight: '700',
    },
    loginBtn: {
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.6)',
    },
    loginText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
});
