jest.mock('@expo/vector-icons/MaterialIcons', () => 'MaterialIcons');

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import IconButton from '../../components/IconButton';

describe('IconButton', () => {
  it('renders the icon', () => {
    const { getByTestId } = render(
      <IconButton icon="add" color="blue" size={24} onPress={() => {}} />
    );
    expect(getByTestId('icon-button')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPressMock = jest.fn();
    const { getByTestId } = render(
      <IconButton icon="add" color="blue" size={24} onPress={onPressMock} />
    );
    fireEvent.press(getByTestId('icon-button'));
    expect(onPressMock).toHaveBeenCalled();
  });
});