import * as SQLite from 'expo-sqlite';
import * as database from '../../util/database';

// Mock expo-sqlite
jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(),
}));

describe('Database Functions', () => {
  let mockDb;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create fresh mock database for each test
    mockDb = {
      execAsync: jest.fn(),
      runAsync: jest.fn(),
      getFirstAsync: jest.fn(),
      getAllAsync: jest.fn(),
    };
    
    SQLite.openDatabaseAsync.mockResolvedValue(mockDb);
  });

  describe('init', () => {
    it('successfully initializes database and creates tables', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      
      await database.init();
      
      expect(SQLite.openDatabaseAsync).toHaveBeenCalledWith('conference_app.db');
      expect(mockDb.execAsync).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE IF NOT EXISTS users')
      );
      expect(consoleSpy).toHaveBeenCalledWith('✅ All tables created successfully');
      
      consoleSpy.mockRestore();
    });

    it('handles database initialization error', async () => {
      const error = new Error('Database connection failed');
      SQLite.openDatabaseAsync.mockRejectedValue(error);
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      await expect(database.init()).rejects.toThrow('Database connection failed');
      expect(consoleSpy).toHaveBeenCalledWith('❌ Database initialization error:', error);
      
      consoleSpy.mockRestore();
    });

    it('handles table creation error', async () => {
      const error = new Error('Table creation failed');
      mockDb.execAsync.mockRejectedValue(error);
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      await expect(database.init()).rejects.toThrow('Table creation failed');
      expect(consoleSpy).toHaveBeenCalledWith('❌ Database initialization error:', error);
      
      consoleSpy.mockRestore();
    });
  });

  describe('insertDefaultRooms', () => {
    beforeEach(async () => {
      // Initialize database before each test in this group
      await database.init();
    });

    it('inserts default rooms when none exist', async () => {
      mockDb.getFirstAsync.mockResolvedValue({ count: 0 });
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      
      await database.insertDefaultRooms();
      
      expect(mockDb.getFirstAsync).toHaveBeenCalledWith('SELECT COUNT(*) as count FROM rooms');
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO rooms'),
        [
          JSON.stringify(['Projector', 'Whiteboard']),
          JSON.stringify(['TV', 'Phone']),
          JSON.stringify(['Projector', 'Video Conference', 'Whiteboard'])
        ]
      );
      expect(consoleSpy).toHaveBeenCalledWith('✅ Default rooms inserted');
      
      consoleSpy.mockRestore();
    });

    it('skips insertion when rooms already exist', async () => {
      const mockResult = { count: 3 };
      mockDb.getFirstAsync.mockResolvedValue(mockResult);
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      
      await database.insertDefaultRooms();
      
      expect(mockDb.getFirstAsync).toHaveBeenCalledWith('SELECT COUNT(*) as count FROM rooms');
      expect(mockDb.runAsync).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(mockResult);
      expect(consoleSpy).toHaveBeenCalledWith('✅ Rooms already exist');
      
      consoleSpy.mockRestore();
    });

    it('handles null result from count query', async () => {
      mockDb.getFirstAsync.mockResolvedValue(null);
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      
      await database.insertDefaultRooms();
      
      expect(mockDb.runAsync).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('✅ Default rooms inserted');
      
      consoleSpy.mockRestore();
    });

    it('handles database error during room insertion', async () => {
      mockDb.getFirstAsync.mockResolvedValue({ count: 0 });
      const error = new Error('Insert failed');
      mockDb.runAsync.mockRejectedValue(error);
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      await database.insertDefaultRooms();
      
      expect(consoleSpy).toHaveBeenCalledWith('❌ Error inserting rooms:', error);
      
      consoleSpy.mockRestore();
    });

    it('handles database error during count query', async () => {
      const error = new Error('Count query failed');
      mockDb.getFirstAsync.mockRejectedValue(error);
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      await database.insertDefaultRooms();
      
      expect(consoleSpy).toHaveBeenCalledWith('❌ Error inserting rooms:', error);
      
      consoleSpy.mockRestore();
    });
  });

  describe('insertDefaultUsers', () => {
    beforeEach(async () => {
      await database.init();
    });

    it('inserts default users when none exist', async () => {
      mockDb.getFirstAsync.mockResolvedValue({ count: 0 });
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      
      await database.insertDefaultUsers();
      
      expect(mockDb.getFirstAsync).toHaveBeenCalledWith('SELECT COUNT(*) as count FROM users');
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO users')
      );
      expect(consoleSpy).toHaveBeenCalledWith('✅ Default users inserted');
      
      consoleSpy.mockRestore();
    });

    it('skips insertion when users already exist', async () => {
      mockDb.getFirstAsync.mockResolvedValue({ count: 2 });
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      
      await database.insertDefaultUsers();
      
      expect(mockDb.runAsync).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('✅ Users already exist');
      
      consoleSpy.mockRestore();
    });

    it('handles null result from count query', async () => {
      mockDb.getFirstAsync.mockResolvedValue(null);
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      
      await database.insertDefaultUsers();
      
      expect(mockDb.runAsync).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('✅ Default users inserted');
      
      consoleSpy.mockRestore();
    });

    it('handles database error during user insertion', async () => {
      mockDb.getFirstAsync.mockResolvedValue({ count: 0 });
      const error = new Error('Insert failed');
      mockDb.runAsync.mockRejectedValue(error);
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      await database.insertDefaultUsers();
      
      expect(consoleSpy).toHaveBeenCalledWith('❌ Error inserting users:', error);
      
      consoleSpy.mockRestore();
    });

    it('handles database error during count query', async () => {
      const error = new Error('Count query failed');
      mockDb.getFirstAsync.mockRejectedValue(error);
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      await database.insertDefaultUsers();
      
      expect(consoleSpy).toHaveBeenCalledWith('❌ Error inserting users:', error);
      
      consoleSpy.mockRestore();
    });
  });

  describe('getAllRooms', () => {
    beforeEach(async () => {
      await database.init();
    });

    it('returns all rooms with parsed amenities', async () => {
      const mockRooms = [
        {
          id: '1',
          name: 'Conference Room A',
          capacity: 10,
          floor: '2nd Floor',
          amenities: JSON.stringify(['Projector', 'Whiteboard'])
        },
        {
          id: '2',
          name: 'Meeting Room B',
          capacity: 6,
          floor: '3rd Floor',
          amenities: JSON.stringify(['TV', 'Phone'])
        }
      ];
      
      mockDb.getAllAsync.mockResolvedValue(mockRooms);
      
      const result = await database.getAllRooms();
      
      expect(mockDb.getAllAsync).toHaveBeenCalledWith('SELECT * FROM rooms');
      expect(result).toEqual([
        {
          id: '1',
          name: 'Conference Room A',
          capacity: 10,
          floor: '2nd Floor',
          amenities: ['Projector', 'Whiteboard']
        },
        {
          id: '2',
          name: 'Meeting Room B',
          capacity: 6,
          floor: '3rd Floor',
          amenities: ['TV', 'Phone']
        }
      ]);
    });

    it('handles empty rooms result', async () => {
      mockDb.getAllAsync.mockResolvedValue([]);
      
      const result = await database.getAllRooms();
      
      expect(result).toEqual([]);
    });

    it('handles database error and returns empty array', async () => {
      const error = new Error('Database error');
      mockDb.getAllAsync.mockRejectedValue(error);
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const result = await database.getAllRooms();
      
      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('❌ Error getting rooms:', error);
      
      consoleSpy.mockRestore();
    });

    it('handles room with invalid JSON amenities', async () => {
      const mockRooms = [
        {
          id: '1',
          name: 'Conference Room A',
          capacity: 10,
          floor: '2nd Floor',
          amenities: 'invalid json'
        }
      ];
      
      mockDb.getAllAsync.mockResolvedValue(mockRooms);
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const result = await database.getAllRooms();
      
      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('❌ Error getting rooms:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });

  describe('createUser', () => {
    beforeEach(async () => {
      await database.init();
    });

    it('creates user successfully with all fields', async () => {
      const userData = {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
        department: 'Engineering'
      };
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      
      const result = await database.createUser(userData);
      
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        'INSERT INTO users (id, email, name, password, department) VALUES (?, ?, ?, ?, ?)',
        ['123', 'test@example.com', 'Test User', 'password123', 'Engineering']
      );
      expect(result).toEqual({
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        department: 'Engineering'
      });
      expect(consoleSpy).toHaveBeenCalledWith('✅ User created in database');
      
      consoleSpy.mockRestore();
    });

    it('creates user with default department when not provided', async () => {
      const userData = {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123'
      };
      
      const result = await database.createUser(userData);
      
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        'INSERT INTO users (id, email, name, password, department) VALUES (?, ?, ?, ?, ?)',
        ['123', 'test@example.com', 'Test User', 'password123', 'General']
      );
      expect(result).toEqual({
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        department: undefined
      });
    });

    it('handles database error during user creation', async () => {
      const userData = {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123'
      };
      
      const error = new Error('UNIQUE constraint failed');
      mockDb.runAsync.mockRejectedValue(error);
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      
      await expect(database.createUser(userData)).rejects.toThrow('UNIQUE constraint failed');
      expect(consoleSpy).toHaveBeenCalledWith('Error occured: ', error);
      
      consoleSpy.mockRestore();
    });
  });

  describe('authenticateUser', () => {
    beforeEach(async () => {
      await database.init();
    });

    it('returns user when credentials are correct', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
        department: 'Engineering'
      };
      
      mockDb.getFirstAsync.mockResolvedValue(mockUser);
      
      const result = await database.authenticateUser('test@example.com', 'password123');
      
      expect(mockDb.getFirstAsync).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE email = ? AND password = ?',
        ['test@example.com', 'password123']
      );
      expect(result).toEqual(mockUser);
    });

    it('returns null when credentials are incorrect', async () => {
      mockDb.getFirstAsync.mockResolvedValue(null);
      
      const result = await database.authenticateUser('wrong@example.com', 'wrongpassword');
      
      expect(result).toBeNull();
    });

    it('returns null when user is undefined', async () => {
      mockDb.getFirstAsync.mockResolvedValue(undefined);
      
      const result = await database.authenticateUser('test@example.com', 'password123');
      
      expect(result).toBeNull();
    });

    it('handles database error and returns null', async () => {
      const error = new Error('Database error');
      mockDb.getFirstAsync.mockRejectedValue(error);
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const result = await database.authenticateUser('test@example.com', 'password123');
      
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('❌ Authentication error:', error);
      
      consoleSpy.mockRestore();
    });
  });

  describe('createBooking', () => {
    beforeEach(async () => {
      await database.init();
    });

    it('creates booking successfully when no conflict', async () => {
      const bookingData = {
        id: 'booking-123',
        roomId: 'room-1',
        userId: 'user-1',
        title: 'Team Meeting',
        description: 'Weekly standup',
        date: '2024-01-15',
        startTime: '09:00',
        endTime: '10:00'
      };
      
      mockDb.getFirstAsync.mockResolvedValue(null); // No conflict
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      
      await database.createBooking(bookingData);
      
      expect(mockDb.getFirstAsync).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM bookings'),
        ['room-1', '2024-01-15', '09:00', '09:00', '10:00', '10:00']
      );
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO bookings'),
        ['booking-123', 'room-1', 'user-1', 'Team Meeting', 'Weekly standup', '2024-01-15', '09:00', '10:00']
      );
      expect(consoleSpy).toHaveBeenCalledWith('✅ Booking created successfully');
      
      consoleSpy.mockRestore();
    });

    it('handles booking without description', async () => {
      const bookingData = {
        id: 'booking-123',
        roomId: 'room-1',
        userId: 'user-1',
        title: 'Team Meeting',
        date: '2024-01-15',
        startTime: '09:00',
        endTime: '10:00'
      };
      
      mockDb.getFirstAsync.mockResolvedValue(null);
      
      await database.createBooking(bookingData);
      
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO bookings'),
        ['booking-123', 'room-1', 'user-1', 'Team Meeting', '', '2024-01-15', '09:00', '10:00']
      );
    });

    it('throws error when there is a time conflict', async () => {
      const bookingData = {
        id: 'booking-123',
        roomId: 'room-1',
        userId: 'user-1',
        title: 'Team Meeting',
        date: '2024-01-15',
        startTime: '09:00',
        endTime: '10:00'
      };
      
      const conflictBooking = {
        id: 'existing-booking',
        start_time: '08:30',
        end_time: '09:30'
      };
      
      mockDb.getFirstAsync.mockResolvedValue(conflictBooking);
      
      await expect(database.createBooking(bookingData)).rejects.toThrow(
        'Room is already booked from 08:30 to 09:30'
      );
      
      expect(mockDb.runAsync).not.toHaveBeenCalled();
    });

    it('handles database error during conflict check', async () => {
      const bookingData = {
        id: 'booking-123',
        roomId: 'room-1',
        userId: 'user-1',
        title: 'Team Meeting',
        date: '2024-01-15',
        startTime: '09:00',
        endTime: '10:00'
      };
      
      const error = new Error('Database error');
      mockDb.getFirstAsync.mockRejectedValue(error);
      
      await expect(database.createBooking(bookingData)).rejects.toThrow('Database error');
    });

    it('handles database error during booking creation', async () => {
      const bookingData = {
        id: 'booking-123',
        roomId: 'room-1',
        userId: 'user-1',
        title: 'Team Meeting',
        date: '2024-01-15',
        startTime: '09:00',
        endTime: '10:00'
      };
      
      mockDb.getFirstAsync.mockResolvedValue(null);
      const error = new Error('Insert failed');
      mockDb.runAsync.mockRejectedValue(error);
      
      await expect(database.createBooking(bookingData)).rejects.toThrow('Insert failed');
    });
  });

  describe('getUserBookings', () => {
    beforeEach(async () => {
      await database.init();
    });

    it('returns user bookings with room information', async () => {
      const mockBookings = [
        {
          id: 'booking-1',
          user_id: 'user-1',
          room_id: 'room-1',
          title: 'Team Meeting',
          date: '2024-01-15',
          start_time: '09:00',
          end_time: '10:00',
          room_name: 'Conference Room A',
          room_floor: '2nd Floor'
        }
      ];
      
      mockDb.getAllAsync.mockResolvedValue(mockBookings);
      
      const result = await database.getUserBookings('user-1');
      
      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('SELECT b.*, r.name as room_name'),
        ['user-1']
      );
      expect(result).toEqual(mockBookings);
    });

    it('returns empty array when user has no bookings', async () => {
      mockDb.getAllAsync.mockResolvedValue([]);
      
      const result = await database.getUserBookings('user-1');
      
      expect(result).toEqual([]);
    });

    it('handles database error and returns empty array', async () => {
      const error = new Error('Database error');
      mockDb.getAllAsync.mockRejectedValue(error);
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const result = await database.getUserBookings('user-1');
      
      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('❌ Error getting user bookings:', error);
      
      consoleSpy.mockRestore();
    });
  });

  describe('getDayBookings', () => {
    beforeEach(async () => {
      await database.init();
    });

    it('returns bookings for specific room and date', async () => {
      const mockBookings = [
        {
          id: 'booking-1',
          room_id: 'room-1',
          date: '2024-01-15',
          start_time: '09:00',
          end_time: '10:00'
        }
      ];
      
      mockDb.getAllAsync.mockResolvedValue(mockBookings);
      
      const result = await database.getDayBookings('room-1', '2024-01-15');
      
      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        'SELECT * FROM bookings WHERE room_id = ? AND date = ? AND status = ? ORDER BY start_time',
        ['room-1', '2024-01-15', 'confirmed']
      );
      expect(result).toEqual(mockBookings);
    });

    it('returns empty array when no bookings exist', async () => {
      mockDb.getAllAsync.mockResolvedValue([]);
      
      const result = await database.getDayBookings('room-1', '2024-01-15');
      
      expect(result).toEqual([]);
    });

    it('handles database error and returns empty array', async () => {
      const error = new Error('Database error');
      mockDb.getAllAsync.mockRejectedValue(error);
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const result = await database.getDayBookings('room-1', '2024-01-15');
      
      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('❌ Error getting day bookings:', error);
      
      consoleSpy.mockRestore();
    });
  });

  describe('cancelBooking', () => {
    beforeEach(async () => {
      await database.init();
    });

    it('cancels booking successfully', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      
      await database.cancelBooking('booking-123');
      
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        'UPDATE bookings SET status = ? WHERE id = ?',
        ['cancelled', 'booking-123']
      );
      expect(consoleSpy).toHaveBeenCalledWith('✅ Booking cancelled successfully');
      
      consoleSpy.mockRestore();
    });

    it('handles database error during cancellation', async () => {
      const error = new Error('Update failed');
      mockDb.runAsync.mockRejectedValue(error);
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      await expect(database.cancelBooking('booking-123')).rejects.toThrow('Update failed');
      expect(consoleSpy).toHaveBeenCalledWith('❌ Error cancelling booking:', error);
      
      consoleSpy.mockRestore();
    });
  });

  describe('deleteBooking', () => {
    beforeEach(async () => {
      await database.init();
    });

    it('deletes booking successfully', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      
      await database.deleteBooking('booking-123');
      
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        'DELETE FROM bookings WHERE id = ?',
        ['booking-123']
      );
      expect(consoleSpy).toHaveBeenCalledWith('🗑️ Deleting booking:', 'booking-123');
      expect(consoleSpy).toHaveBeenCalledWith('✅ Booking deleted successfully');
      
      consoleSpy.mockRestore();
    });

    it('handles database error during deletion', async () => {
      const error = new Error('Delete failed');
      mockDb.runAsync.mockRejectedValue(error);
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      await expect(database.deleteBooking('booking-123')).rejects.toThrow('Delete failed');
      expect(consoleSpy).toHaveBeenCalledWith('❌ Error deleting booking:', error);
      
      consoleSpy.mockRestore();
    });
  });
});