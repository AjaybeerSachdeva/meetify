import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, Pressable, StyleSheet, Alert, ScrollView } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import IconButton from './IconButton';
import { responsiveSize, responsiveFontSize, scaleWidth, scaleHeight, getDynamicSize, useOrientation } from '../util/responsive';

function UserProfileModal({ visible, onClose }) {
    const isLandscape = useOrientation();
    const [showPassword, setShowPassword] = useState(false);
    const user = useSelector(state => state.user.info);

    if (!user) return null;

    return (
        <Modal 
            visible={visible} 
            animationType='slide'
            presentationStyle='pageSheet' 
        >
            <View style={styles.overlay}>
                <View style={[
                    styles.modalWrapper,
                    isLandscape && styles.modalWrapperLandscape
                ]}>
                    <View style={[
                        styles.modalContainer,
                        isLandscape && styles.modalContainerLandscape
                    ]}>
                        <View style={styles.header}>
                            <Text style={styles.title}>Profile Information</Text>
                            <IconButton 
                                icon="close" 
                                size={24} 
                                color="#666" 
                                onPress={onClose}
                            />
                        </View>
                        <ScrollView
                            contentContainerStyle={styles.scrollContent}
                            showsVerticalScrollIndicator={false}
                        >
                            <View style={styles.content}>
                                <View style={styles.infoRow}>
                                    <View style={styles.labelContainer}>
                                        <IconButton 
                                            icon="person" 
                                            size={20} 
                                            color="#007AFF" 
                                        />
                                        <Text style={styles.label}>Name:</Text>
                                    </View>
                                    <Text style={styles.value}>{user.name}</Text>
                                </View>
                                <View style={styles.infoRow}>
                                    <View style={styles.labelContainer}>
                                        <IconButton 
                                            icon="email" 
                                            size={20} 
                                            color="#007AFF" 
                                        />
                                        <Text style={styles.label}>Email:</Text>
                                    </View>
                                    <Text style={styles.value}>{user.email}</Text>
                                </View>
                                <View style={styles.infoRow}>
                                    <View style={styles.labelContainer}>
                                        <IconButton 
                                            icon="business" 
                                            size={20} 
                                            color="#007AFF" 
                                        />
                                        <Text style={styles.label}>Department:</Text>
                                    </View>
                                    <Text style={styles.value}>{user.department || 'General'}</Text>
                                </View>
                                <View style={styles.infoRow}>
                                    <View style={styles.labelContainer}>
                                        <IconButton 
                                            icon="lock" 
                                            size={20} 
                                            color="#007AFF" 
                                        />
                                        <Text style={styles.label}>Password:</Text>
                                    </View>
                                    <View style={styles.passwordContainer}>
                                        <Text style={styles.value}>
                                            {showPassword ? user.password : '••••••••'}
                                        </Text>
                                        <IconButton 
                                            icon={showPassword ? "visibility-off" : "visibility"} 
                                            size={20} 
                                            color="#007AFF" 
                                            onPress={() => setShowPassword(!showPassword)}
                                            testID='password-visibility-toggle'
                                        />
                                    </View>
                                </View>
                            </View>
                            <Pressable 
                                style={styles.bottomCloseButton}
                                onPress={onClose}
                            >
                                <View style={styles.bottomButtonContent}>
                                    <Text style={styles.bottomCloseButtonText}>Close</Text>
                                </View>
                            </Pressable>
                        </ScrollView>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

export default UserProfileModal;

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalWrapper: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
        width: '100%',
    },
    modalWrapperLandscape: {
        paddingVertical: 20,
    },
    modalContainer: {
        backgroundColor: 'white',
        width: '90%',
        maxWidth: 400,
        maxHeight: '90%',
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
        flexShrink: 1,
    },
    modalContainerLandscape: {
        maxWidth: 600,
        width: '80%',
        maxHeight: '80%',
        padding: 16,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'flex-start',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    content: {
        marginBottom: 20,
    },
    infoRow: {
        marginBottom: 15,
    },
    labelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
        flexShrink: 1,
        flexWrap: 'wrap',
        maxWidth: '80%',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        marginLeft: 8,
        flexShrink: 1,
        flexWrap: 'wrap',
        maxWidth: '80%',
    },
    value: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
        marginLeft: 28, 
        flexShrink: 1,
        flexWrap: 'wrap',
        maxWidth: '80%',
    },
    passwordContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginLeft: 28, 
    },
    bottomCloseButton: {
        backgroundColor: '#6c757d',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    bottomButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    bottomCloseButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
});