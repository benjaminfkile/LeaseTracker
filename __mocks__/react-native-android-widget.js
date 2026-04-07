const React = require('react');
const { View, Text } = require('react-native');

const FlexWidget = ({ children, clickAction, style: _s, ...rest }) =>
  React.createElement(View, { testID: 'flex-widget', clickAction, ...rest }, children);

const TextWidget = ({ value, style: _s, maxLines: _m, ...rest }) =>
  React.createElement(Text, { testID: 'text-widget', ...rest }, value);

const ImageWidget = ({ style: _s, ...rest }) =>
  React.createElement(View, { testID: 'image-widget', ...rest });

const requestWidgetUpdate = jest.fn(() => Promise.resolve());
const registerWidgetTaskHandler = jest.fn();

module.exports = {
  FlexWidget,
  TextWidget,
  ImageWidget,
  requestWidgetUpdate,
  registerWidgetTaskHandler,
};
