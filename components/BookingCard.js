import React from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { responsiveSize, responsiveFontSize, scaleHeight } from '../util/responsive';


function BookingCard({ booking, onCancel, onDelete }) {
  const isPastBooking = () => {
    const bookingEndDateTime = new Date(`${booking.date}T${booking.endTime.split('T')[1] || booking.endTime}`);
    const now = new Date();
    return bookingEndDateTime < now;
  };

  const handleCancelPress = () => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking?',
      [
        { text: 'No', style: 'cancel' },
        { text: 'Yes', style: 'destructive', onPress: onCancel }
      ]
    );
  };

  const handleDeletePress = () => {
    Alert.alert(
      'Delete Booking Record',
      'This will permanently remove this booking from your history. Continue?',
      [
        { text: 'No', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: onDelete }
      ]
    );
  };

  const pastBooking = isPastBooking();

  return (
    <View style={[styles.container, pastBooking && styles.pastBooking]}>
      <View style={styles.header}>
        <Text style={styles.title}>{booking.title}</Text>
        <Text style={[
          styles.status,
          pastBooking ? styles.pastStatus : styles.activeStatus
        ]}>
          {pastBooking ? 'completed' : 'confirmed'}
        </Text>
      </View>
      
      <Text style={styles.roomName}>
        {booking.roomName || `Room ${booking.roomId}`} • {booking.roomFloor}
      </Text>
      
      <Text style={styles.date}>
        📅 {new Date(booking.date).toLocaleDateString('en-US', {
          weekday: 'short',
          year: 'numeric', 
          month: 'short', 
          day: 'numeric'
        })}
      </Text>
      
      <Text style={styles.time}>
  🕐 {booking.startTime.includes('T') ? 
    booking.startTime.split('T')[1].substring(0, 5) :
    booking.startTime
  } - {booking.endTime.includes('T') ?
    booking.endTime.split('T')[1].substring(0, 5) :
    booking.endTime
  }
</Text>
      
      {booking.description && (
        <Text style={styles.description}>{booking.description}</Text>
      )}
      
      <View style={styles.buttonContainer}>
        {pastBooking ? (
          <Pressable 
            style={({pressed}) => [styles.deleteButton, pressed && styles.pressed]}
            onPress={handleDeletePress}
          >
            <Text style={styles.deleteButtonText}>🗑️ Delete Record</Text>
          </Pressable>
        ) : (
          <Pressable 
            style={({pressed}) => [styles.cancelButton, pressed && styles.pressed]}
            onPress={handleCancelPress}
          >
            <Text style={styles.cancelButtonText}>Cancel Booking</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

export default BookingCard;

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    margin: responsiveSize.lg,    
    marginBottom: responsiveSize.md,
    padding: responsiveSize.lg,      
    borderRadius: responsiveSize.md,  
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scaleHeight(2) },
    shadowOpacity: 0.1,
    shadowRadius: responsiveSize.xs, 
    elevation: 3,
  },
  pastBooking: {
    backgroundColor: '#f8f9fa',
    opacity: 0.85,
    borderLeftWidth: responsiveSize.xs, 
    borderLeftColor: '#6c757d',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: responsiveSize.md,  
  },
  title: {
    fontSize: responsiveFontSize.xl, 
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: responsiveSize.md,  
  },
  status: {
    fontSize: responsiveFontSize.xs, 
    fontWeight: 'bold',
    paddingHorizontal: responsiveSize.sm, 
    paddingVertical: responsiveSize.xs,  
    borderRadius: responsiveSize.md,     
  },
  activeStatus: {
    color: '#28a745',
    backgroundColor: '#d4edda',
  },
  pastStatus: {
    color: '#6c757d',
    backgroundColor: '#e2e3e5',
  },
  roomName: {
    fontSize: responsiveFontSize.lg,  
    color: '#007AFF',
    marginBottom: responsiveSize.xs,  
    fontWeight: '600',
  },
  date: {
    fontSize: responsiveFontSize.md, 
    color: '#666',
    marginBottom: responsiveSize.xs,  
  },
  time: {
    fontSize: responsiveFontSize.md, 
    color: '#666',
    marginBottom: responsiveSize.md,  
  },
  description: {
    fontSize: responsiveFontSize.md, 
    color: '#888',
    fontStyle: 'italic',
    marginBottom: responsiveSize.lg,  
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: responsiveSize.xl, 
    paddingVertical: responsiveSize.md,   
    borderRadius: responsiveSize.sm,     
    flex: 1,
    minHeight: responsiveSize.xxl * 2,
    justifyContent:'center'
  },
  cancelButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: responsiveFontSize.md,     
  },
  deleteButton: {
    backgroundColor: '#6c757d',
    paddingHorizontal: responsiveSize.xl, 
    paddingVertical: responsiveSize.md,   
    borderRadius: responsiveSize.sm,     
    flex: 1,
    minHeight: responsiveSize.xxl * 2,    
    justifyContent:'center'
  },
  deleteButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: responsiveFontSize.md,
  },
  pressed: {
    opacity: 0.75,
  },
});