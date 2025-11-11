import * as SQLite from 'expo-sqlite';

let database;

export async function init() {
  try {
    database = await SQLite.openDatabaseAsync('conference_app.db');
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY NOT NULL,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        password TEXT NOT NULL,
        department TEXT DEFAULT 'General'
      );
      
      CREATE TABLE IF NOT EXISTS rooms (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        capacity INTEGER NOT NULL,
        floor TEXT NOT NULL,
        amenities TEXT NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS bookings (
        id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT NOT NULL,
        room_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        date TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        status TEXT DEFAULT 'confirmed'
      );
    `);
    
    console.log('✅ All tables created successfully');
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    throw error;
  }
}

export async function insertDefaultRooms() {
  try {
    const result = await database.getFirstAsync('SELECT COUNT(*) as count FROM rooms');
    if (result && result.count > 0) {
      console.log(result);
      console.log('✅ Rooms already exist');
      return;
    }

    await database.runAsync(
      `INSERT INTO rooms (id, name, capacity, floor, amenities) VALUES 
       ('1', 'Conference Room A', 10, '2nd Floor', ?),
       ('2', 'Meeting Room B', 6, '3rd Floor', ?),
       ('3', 'Executive Boardroom', 15, '5th Floor', ?)`,
      [
        JSON.stringify(['Projector', 'Whiteboard']),
        JSON.stringify(['TV', 'Phone']), 
        JSON.stringify(['Projector', 'Video Conference', 'Whiteboard'])
      ]
    );
    
    console.log('✅ Default rooms inserted');
  } catch (error) {
    console.error('❌ Error inserting rooms:', error);
  }
}

export async function insertDefaultUsers() {
  try {
    const result = await database.getFirstAsync('SELECT COUNT(*) as count FROM users');
    if (result && result.count > 0) {
      console.log('✅ Users already exist');
      return;
    }

    await database.runAsync(
      `INSERT INTO users (id, email, name, password, department) VALUES 
       ('1', 'demo@company.com', 'Demo User', '123456', 'Engineering'),
       ('2', 'admin@company.com', 'Admin User', 'admin', 'Management')`
    );
    
    console.log('✅ Default users inserted');
  } catch (error) {
    console.error('❌ Error inserting users:', error);
  }
}

export async function getAllRooms() {
  try {
    const rooms = await database.getAllAsync('SELECT * FROM rooms');
    return rooms.map(room => ({
      ...room,
      amenities: JSON.parse(room.amenities)
    }));
  } catch (error) {
    console.error('❌ Error getting rooms:', error);
    return [];
  }
}

export async function createUser(userData) {
  try {
    const { id, email, name, password, department } = userData;
    
    await database.runAsync(
      'INSERT INTO users (id, email, name, password, department) VALUES (?, ?, ?, ?, ?)',
      [id, email, name, password, department || 'General']
    );
    
    console.log('✅ User created in database');
    return { id, email, name, department};
  } catch (error) {
    console.log("Error occured: ",error);
    throw error;
  }
}

export async function authenticateUser(email, password) {
  try {
    const user = await database.getFirstAsync(
      'SELECT * FROM users WHERE email = ? AND password = ?',
      [email, password]
    );
    return user || null;
  } catch (error) {
    console.error('❌ Authentication error:', error);
    return null;
  }
}

export async function createBooking(bookingData) {
  try {
    const { id, roomId, userId, title, description, date, startTime, endTime } = bookingData;
    
    const conflict = await database.getFirstAsync(
      `SELECT * FROM bookings 
       WHERE room_id = ? AND date = ? AND status = 'confirmed'
       AND ((start_time <= ? AND end_time > ?) OR (start_time < ? AND end_time >= ?))`,
      [roomId, date, startTime, startTime, endTime, endTime]
    );
    
    if (conflict) {
      throw new Error(`Room is already booked from ${conflict.start_time} to ${conflict.end_time}`);
    }

    await database.runAsync(
      `INSERT INTO bookings (id, room_id, user_id, title, description, date, start_time, end_time, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'confirmed')`,
      [id, roomId, userId, title, description || '', date, startTime, endTime]
    );
    
    console.log('✅ Booking created successfully');
  } catch (error) {
    throw error;
  }
}

export async function getUserBookings(userId) {
  try {
    const bookings = await database.getAllAsync(
      `SELECT b.*, r.name as room_name, r.floor as room_floor 
       FROM bookings b 
       JOIN rooms r ON b.room_id = r.id 
       WHERE b.user_id = ? AND b.status = 'confirmed'
       ORDER BY b.date, b.start_time`,
      [userId]
    );
    return bookings;
  } catch (error) {
    console.error('❌ Error getting user bookings:', error);
    return [];
  }
}

export async function getDayBookings(roomId, date) {
  try {
    const bookings = await database.getAllAsync(
      'SELECT * FROM bookings WHERE room_id = ? AND date = ? AND status = ? ORDER BY start_time',
      [roomId, date, 'confirmed']
    );
    return bookings;
  } catch (error) {
    console.error('❌ Error getting day bookings:', error);
    return [];
  }
}

export async function cancelBooking(bookingId) {
  try {
    await database.runAsync(
      'UPDATE bookings SET status = ? WHERE id = ?',
      ['cancelled', bookingId]
    );
    console.log('✅ Booking cancelled successfully');
  } catch (error) {
    console.error('❌ Error cancelling booking:', error);
    throw error;
  }
}

export async function deleteBooking(bookingId) {
  try {
    console.log('🗑️ Deleting booking:', bookingId);
    
    await database.runAsync(
      'DELETE FROM bookings WHERE id = ?',
      [bookingId]
    );
    
    console.log('✅ Booking deleted successfully');
  } catch (error) {
    console.error('❌ Error deleting booking:', error);
    throw error;
  }
}
