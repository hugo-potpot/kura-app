const React = require('react');
const { View } = require('react-native');

function MockMapView(props) {
  return React.createElement(View, { testID: props.testID ?? 'mock-map-view', ...props });
}

module.exports = {
  __esModule: true,
  default: MockMapView,
  Marker: View,
  Polyline: View,
  PROVIDER_GOOGLE: 'google',
};
