import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import UserProfileModal from "../../components/UserProfileModal";

// Mock IconButton to avoid vector icon issues
jest.mock("../../components/IconButton", () => "IconButton");

// Mock Redux hooks
const mockDispatch = jest.fn();
jest.mock("react-redux", () => ({
  useSelector: jest.fn(),
  useDispatch: () => mockDispatch,
}));

describe("UserProfileModal", () => {
  const mockUser = {
    name: "Alice",
    email: "alice@example.com",
    department: "Engineering",
    password: "secret123",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    require("react-redux").useSelector.mockImplementation((fn) =>
      fn({ user: { info: mockUser } })
    );
  });

  it("renders user info fields", () => {
    const { getByText } = render(
      <UserProfileModal visible={true} onClose={jest.fn()} />
    );
    expect(getByText("Profile Information")).toBeTruthy();
    expect(getByText("Name:")).toBeTruthy();
    expect(getByText("Alice")).toBeTruthy();
    expect(getByText("Email:")).toBeTruthy();
    expect(getByText("alice@example.com")).toBeTruthy();
    expect(getByText("Department:")).toBeTruthy();
    expect(getByText("Engineering")).toBeTruthy();
    expect(getByText("Password:")).toBeTruthy();
    expect(getByText("••••••••")).toBeTruthy();
  });

  it("shows password when visibility icon is pressed", () => {
  const { getByText, getByTestId } = render(
    <UserProfileModal visible={true} onClose={jest.fn()} />
  );
  fireEvent.press(getByTestId("password-visibility-toggle"));
  expect(getByText("secret123")).toBeTruthy();
});

  it("calls onClose when close button is pressed", () => {
    const onClose = jest.fn();
    const { getByText } = render(
      <UserProfileModal visible={true} onClose={onClose} />
    );
    fireEvent.press(getByText("Close"));
    expect(onClose).toHaveBeenCalled();
  });

  it("returns null if user is not present", () => {
    require("react-redux").useSelector.mockImplementation(() =>
      undefined
    );
    const { toJSON } = render(
      <UserProfileModal visible={true} onClose={jest.fn()} />
    );
    expect(toJSON()).toBeNull();
  });


  it("displays 'General' when user has no department", () => {
    const userWithoutDepartment = {
      name: "Bob",
      email: "bob@example.com", 
      department: null, // This will trigger the fallback
      password: "secret456",
    };

    require("react-redux").useSelector.mockImplementation((fn) =>
      fn({ user: { info: userWithoutDepartment } })
    );

    const { getByText } = render(
      <UserProfileModal visible={true} onClose={jest.fn()} />
    );

    expect(getByText("General")).toBeTruthy();
    expect(getByText("Department:")).toBeTruthy();
  });

  it("displays 'General' when user department is undefined", () => {
    const userWithUndefinedDepartment = {
      name: "Charlie",
      email: "charlie@example.com",
      // department is undefined (not present)
      password: "secret789",
    };

    require("react-redux").useSelector.mockImplementation((fn) =>
      fn({ user: { info: userWithUndefinedDepartment } })
    );

    const { getByText } = render(
      <UserProfileModal visible={true} onClose={jest.fn()} />
    );

    expect(getByText("General")).toBeTruthy();
  });

  it("displays 'General' when user department is empty string", () => {
    const userWithEmptyDepartment = {
      name: "David",
      email: "david@example.com",
      department: "", // Empty string is falsy
      password: "secret000",
    };

    require("react-redux").useSelector.mockImplementation((fn) =>
      fn({ user: { info: userWithEmptyDepartment } })
    );

    const { getByText } = render(
      <UserProfileModal visible={true} onClose={jest.fn()} />
    );

    expect(getByText("General")).toBeTruthy();
  });
});