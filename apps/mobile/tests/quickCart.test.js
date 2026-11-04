const React = require('react');
const { fireEvent, render } = require('@testing-library/react-native');
const { QuickCartButton } = require('../src/components/QuickCartButton');

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('../src/components/PurchaseSelector', () => ({
  PurchaseSelector: ({ productId, mode, onClose }) =>
    require('react').createElement(require('react-native').Button, { title: `Đóng ${mode} ${productId}`, onPress: onClose }),
}));

test('only mounts the selected product picker after pressing the cart button', () => {
  const view = render(React.createElement(QuickCartButton, { productId: 42, name: 'Điện thoại' }));

  expect(view.queryByRole('button', { name: 'Đóng cart 42' })).toBeNull();
  fireEvent.press(view.getByRole('button', { name: 'Thêm Điện thoại vào giỏ' }), {
    stopPropagation: jest.fn(),
  });
  fireEvent.press(view.getByRole('button', { name: 'Đóng cart 42' }));
  expect(view.queryByRole('button', { name: 'Đóng cart 42' })).toBeNull();
});
