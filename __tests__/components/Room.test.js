import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import Room from "../../components/Room";

// Mock the navigation
const mockNavigate = jest.fn();
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

describe("Room Component", () => {
  const mockRoomProps = {
    id: "1",
    name: "Conference Room A",
    floor: "2nd Floor",
    capacity: 10,
    amenities: ["Projector", "Whiteboard"],
  };

  it("renders all room details correctly", () => {
    const { getByText } = render(<Room {...mockRoomProps} />);
    expect(getByText("Conference Room A")).toBeTruthy();
    expect(getByText("2nd Floor")).toBeTruthy();
    expect(getByText("Room has a capacity of 10 people")).toBeTruthy();
    expect(getByText("Amenities: Projector, Whiteboard")).toBeTruthy();
  });

  it("navigates to BookRoom with correct params when pressed", () => {
    const { getByText } = render(<Room {...mockRoomProps} />);
    fireEvent.press(getByText("Conference Room A"));
    expect(mockNavigate).toHaveBeenCalledWith("BookRoom", {
      room: mockRoomProps,
    });
  });

  it("handles empty amenities gracefully", () => {
    const { getByText } = render(
      <Room {...mockRoomProps} amenities={[]} />
    );
    expect(getByText("Amenities: ")).toBeTruthy();
  });

});