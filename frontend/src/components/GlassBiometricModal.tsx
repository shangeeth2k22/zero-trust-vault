import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { COLORS } from '../config/api';

interface GlassBiometricModalProps {
  visible: boolean;
  title?: string;
  subtitle?: string;
  onCancel: () => void;
}

export const GlassBiometricModal: React.FC<GlassBiometricModalProps> = ({
  visible,
  title = 'Zero-Trust Authentication',
  subtitle = 'Touch the fingerprint sensor or scan FaceID',
  onCancel,
}) => {
  return (
    <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.glassCard}>
          
          {/* Glowing Glass Fingerprint Emblem */}
          <View style={styles.fpGlowOuter}>
            <View style={styles.fpGlowInner}>
              <View style={fpStyles.iconWrapper}>
                <View style={[fpStyles.fingerLine, fpStyles.line1]} />
                <View style={[fpStyles.fingerLine, fpStyles.line2]} />
                <View style={[fpStyles.fingerLine, fpStyles.line3]} />
                <View style={fpStyles.fingerCore} />
              </View>
            </View>
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>

          <View style={styles.statusRow}>
            <ActivityIndicator size="small" color={COLORS.purplePrimary} style={{ marginRight: 8 }} />
            <Text style={styles.statusText}>Waiting for biometric sensor...</Text>
          </View>

          <TouchableOpacity style={styles.cancelButton} onPress={onCancel} activeOpacity={0.75}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const fpStyles = StyleSheet.create({
  iconWrapper: {
    width: 60,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fingerLine: {
    borderWidth: 3,
    borderColor: COLORS.purplePrimary,
    borderRadius: 20,
    position: 'absolute',
  },
  line1: { width: 52, height: 64, borderBottomWidth: 0, borderTopLeftRadius: 26, borderTopRightRadius: 26 },
  line2: { width: 38, height: 50, borderBottomWidth: 0, borderTopLeftRadius: 19, borderTopRightRadius: 19 },
  line3: { width: 24, height: 36, borderBottomWidth: 0, borderTopLeftRadius: 12, borderTopRightRadius: 12 },
  fingerCore: { width: 8, height: 14, backgroundColor: COLORS.purplePrimary, borderRadius: 4, marginTop: 14 },
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    width: '100%',
    borderRadius: 30,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: COLORS.purplePrimary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  fpGlowOuter: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(91, 70, 246, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(91, 70, 246, 0.15)',
  },
  fpGlowInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(91, 70, 246, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(91, 70, 246, 0.08)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginBottom: 24,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.purplePrimary,
  },
  cancelButton: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(241, 245, 249, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
  },
  cancelText: {
    color: COLORS.textSecondary,
    fontSize: 15,
    fontWeight: '700',
  },
});
