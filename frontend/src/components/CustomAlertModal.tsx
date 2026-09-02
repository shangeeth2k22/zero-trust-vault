import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../config/api';

interface CustomAlertProps {
  visible: boolean;
  type?: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  buttonText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  showCancel?: boolean;
}

export const CustomAlertModal: React.FC<CustomAlertProps> = ({
  visible,
  type = 'info',
  title,
  message,
  buttonText = 'OK',
  onConfirm,
  onCancel,
  showCancel = false,
}) => {
  const getIcon = () => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '⚠️';
      case 'warning': return '🔒';
      default: return 'ℹ️';
    }
  };

  const getIconBg = () => {
    switch (type) {
      case 'success': return 'rgba(16, 185, 129, 0.14)';
      case 'error': return 'rgba(239, 68, 68, 0.14)';
      case 'warning': return 'rgba(91, 70, 246, 0.14)';
      default: return 'rgba(91, 70, 246, 0.14)';
    }
  };

  return (
    <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onConfirm}>
      <View style={styles.centerModalOverlay}>
        <View style={styles.customAlertCard}>
          <View style={[styles.alertIconBadge, { backgroundColor: getIconBg() }]}>
            <Text style={styles.alertIcon}>{getIcon()}</Text>
          </View>

          <Text style={styles.alertTitle}>{title}</Text>
          <Text style={styles.alertSubtitle}>{message}</Text>

          <TouchableOpacity
            style={[styles.alertPrimaryButton, type === 'error' && styles.alertButtonError]}
            onPress={onConfirm}
            activeOpacity={0.85}
          >
            <Text style={styles.alertPrimaryText}>{buttonText}</Text>
          </TouchableOpacity>

          {showCancel && onCancel && (
            <TouchableOpacity style={styles.alertCancelButton} onPress={onCancel} activeOpacity={0.7}>
              <Text style={styles.alertCancelText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
    shadowColor: COLORS.purplePrimary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  alertIconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  alertIcon: {
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
  alertPrimaryButton: {
    backgroundColor: COLORS.purplePrimary,
    width: '100%',
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.purplePrimary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  alertButtonError: {
    backgroundColor: COLORS.danger,
    shadowColor: COLORS.danger,
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
    marginTop: 8,
  },
  alertCancelText: {
    color: COLORS.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
});
