import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import BookingCard from "../../components/BookingCard";

// Only mock Alert.alert, not the whole module!
jest.spyOn(require('react-native').Alert, 'alert').mockImplementation(jest.fn());

describe("BookingCard", () => {
  const baseBooking = {
    id: "b1",
    title: "Team Sync",
    roomName: "Conference Room A",
    roomId: "1",
    roomFloor: "2nd Floor",
    date: "2099-12-31", // future date for active booking
    startTime: "09:00",
    endTime: "10:00",
    description: "Weekly team sync-up",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders booking details", () => {
    const { getByText } = render(
      <BookingCard booking={baseBooking} onCancel={jest.fn()} onDelete={jest.fn()} />
    );
    expect(getByText("Team Sync")).toBeTruthy();
    expect(getByText("Conference Room A • 2nd Floor")).toBeTruthy();
    expect(getByText(/Weekly team sync-up/)).toBeTruthy();
    expect(getByText(/confirmed/)).toBeTruthy();
    expect(getByText(/Cancel Booking/)).toBeTruthy();
  });

  it("shows 'completed' and delete button for past bookings", () => {
    // Use a past date
    const pastBooking = { ...baseBooking, date: "2000-01-01" };
    const { getByText, queryByText } = render(
      <BookingCard booking={pastBooking} onCancel={jest.fn()} onDelete={jest.fn()} />
    );
    expect(getByText(/completed/)).toBeTruthy();
    expect(getByText(/Delete Record/)).toBeTruthy();
    expect(queryByText(/Cancel Booking/)).toBeNull();
  });

  it("calls onCancel when 'Cancel Booking' is confirmed", () => {
    const onCancel = jest.fn();
    const { getByText } = render(
      <BookingCard booking={baseBooking} onCancel={onCancel} onDelete={jest.fn()} />
    );
    fireEvent.press(getByText(/Cancel Booking/));
    // Simulate user pressing 'Yes' in Alert
    const Alert = require("react-native").Alert;
    expect(Alert.alert).toHaveBeenCalled();
    // Find the 'Yes' button and call its onPress
    const yesButton = Alert.alert.mock.calls[0][2].find(
      (btn) => btn.text === "Yes"
    );
    yesButton.onPress();
    expect(onCancel).toHaveBeenCalled();
  });

  it("calls onDelete when 'Delete Record' is confirmed", () => {
    const onDelete = jest.fn();
    const pastBooking = { ...baseBooking, date: "2000-01-01" };
    const { getByText } = render(
      <BookingCard booking={pastBooking} onCancel={jest.fn()} onDelete={onDelete} />
    );
    fireEvent.press(getByText(/Delete Record/));
    // Simulate user pressing 'Delete' in Alert
    const Alert = require("react-native").Alert;
    expect(Alert.alert).toHaveBeenCalled();
    const deleteButton = Alert.alert.mock.calls[0][2].find(
      (btn) => btn.text === "Delete"
    );
    deleteButton.onPress();
    expect(onDelete).toHaveBeenCalled();
  });

  // new tests

    describe("Time Format Handling", () => {
    it("handles ISO datetime format for start and end times", () => {
      const bookingWithISOTime = {
        ...baseBooking,
        startTime: "2099-12-31T09:00:00.000Z", // ISO format with 'T'
        endTime: "2099-12-31T10:30:00.000Z"    // ISO format with 'T'
      };

      const { getByText } = render(
        <BookingCard 
          booking={bookingWithISOTime} 
          onCancel={jest.fn()} 
          onDelete={jest.fn()} 
        />
      );

      // Should extract time portion after 'T' and show first 5 characters (HH:MM)
      expect(getByText(/🕐 09:00 - 10:30/)).toBeTruthy();
    });

    it("handles simple time format for start and end times", () => {
      const bookingWithSimpleTime = {
        ...baseBooking,
        startTime: "14:15", // Simple format without 'T'
        endTime: "15:45"    // Simple format without 'T'
      };

      const { getByText } = render(
        <BookingCard 
          booking={bookingWithSimpleTime} 
          onCancel={jest.fn()} 
          onDelete={jest.fn()} 
        />
      );

      // Should use time as-is
      expect(getByText(/🕐 14:15 - 15:45/)).toBeTruthy();
    });

    it("handles mixed time formats (ISO start, simple end)", () => {
      const bookingWithMixedTime = {
        ...baseBooking,
        startTime: "2099-12-31T08:30:00.000Z", // ISO format
        endTime: "09:15"                        // Simple format
      };

      const { getByText } = render(
        <BookingCard 
          booking={bookingWithMixedTime} 
          onCancel={jest.fn()} 
          onDelete={jest.fn()} 
        />
      );

      expect(getByText(/🕐 08:30 - 09:15/)).toBeTruthy();
    });

    it("handles mixed time formats (simple start, ISO end)", () => {
      const bookingWithMixedTime = {
        ...baseBooking,
        startTime: "16:45",                     // Simple format
        endTime: "2099-12-31T17:30:00.000Z"    // ISO format
      };

      const { getByText } = render(
        <BookingCard 
          booking={bookingWithMixedTime} 
          onCancel={jest.fn()} 
          onDelete={jest.fn()} 
        />
      );

      expect(getByText(/🕐 16:45 - 17:30/)).toBeTruthy();
    });

    it("handles ISO format with seconds in time display", () => {
      const bookingWithSeconds = {
        ...baseBooking,
        startTime: "2099-12-31T13:45:30.000Z", // With seconds
        endTime: "2099-12-31T14:20:15.000Z"    // With seconds
      };

      const { getByText } = render(
        <BookingCard 
          booking={bookingWithSeconds} 
          onCancel={jest.fn()} 
          onDelete={jest.fn()} 
        />
      );

      // Should only show HH:MM (first 5 chars after 'T')
      expect(getByText(/🕐 13:45 - 14:20/)).toBeTruthy();
    });
  });

  describe("Past Booking Detection with ISO Times", () => {
    it("correctly identifies past booking with ISO datetime", () => {
      // Create a booking that ended 1 hour ago
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const pastBookingISO = {
        ...baseBooking,
        date: oneHourAgo.toISOString().split('T')[0], // Today's date
        endTime: oneHourAgo.toISOString() // ISO format ending in past
      };

      const { getByText, queryByText } = render(
        <BookingCard 
          booking={pastBookingISO} 
          onCancel={jest.fn()} 
          onDelete={jest.fn()} 
        />
      );

      expect(getByText(/completed/)).toBeTruthy();
      expect(getByText(/Delete Record/)).toBeTruthy();
      expect(queryByText(/Cancel Booking/)).toBeNull();
    });

    it("correctly identifies future booking with ISO datetime", () => {
      // Create a booking that ends 1 hour from now
      const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);
      const futureBookingISO = {
        ...baseBooking,
        date: oneHourFromNow.toISOString().split('T')[0], // Today's date
        endTime: oneHourFromNow.toISOString() // ISO format ending in future
      };

      const { getByText, queryByText } = render(
        <BookingCard 
          booking={futureBookingISO} 
          onCancel={jest.fn()} 
          onDelete={jest.fn()} 
        />
      );

      expect(getByText(/confirmed/)).toBeTruthy();
      expect(getByText(/Cancel Booking/)).toBeTruthy();
      expect(queryByText(/Delete Record/)).toBeNull();
    });
  });

  // Test edge cases
  describe("Edge Cases", () => {
    it("renders without description", () => {
      const bookingWithoutDescription = {
        ...baseBooking,
        description: undefined
      };

      const { queryByText } = render(
        <BookingCard 
          booking={bookingWithoutDescription} 
          onCancel={jest.fn()} 
          onDelete={jest.fn()} 
        />
      );

      expect(queryByText(/Weekly team sync-up/)).toBeNull();
    });

    it("renders with missing roomName", () => {
      const bookingWithoutRoomName = {
        ...baseBooking,
        roomName: undefined
      };

      const { getByText } = render(
        <BookingCard 
          booking={bookingWithoutRoomName} 
          onCancel={jest.fn()} 
          onDelete={jest.fn()} 
        />
      );

      // Should fallback to "Room {roomId}"
      expect(getByText(/Room 1 • 2nd Floor/)).toBeTruthy();
    });

    it("handles empty roomName", () => {
      const bookingWithEmptyRoomName = {
        ...baseBooking,
        roomName: ""
      };

      const { getByText } = render(
        <BookingCard 
          booking={bookingWithEmptyRoomName} 
          onCancel={jest.fn()} 
          onDelete={jest.fn()} 
        />
      );

      // Should fallback to "Room {roomId}"
      expect(getByText(/Room 1 • 2nd Floor/)).toBeTruthy();
    });
  });

  // styles.pressed testing 


});