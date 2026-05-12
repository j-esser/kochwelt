// Expo Config Plugin — relaxiert Hardware-Filter im Android-Manifest, damit
// die App auf Chromebooks und Tablets ohne Telefonie/Touchscreen-Hardware
// im Play Store als kompatibel angezeigt wird.
//
// Android setzt `android.hardware.touchscreen` standardmäßig als
// `required="true"` voraus. Viele Chromebook-Geräteklassen erfüllen das
// nicht exakt (auch wenn ein Touchscreen physisch vorhanden ist), wodurch
// die App im Play Store als "nicht kompatibel" gilt.
//
// Hier markieren wir alle hardware-bezogenen Features, die für Kochwelt
// nicht zwingend nötig sind, explizit als `required="false"`.

const { withAndroidManifest } = require('@expo/config-plugins');

const FEATURES_NOT_REQUIRED = [
  'android.hardware.touchscreen',
  'android.hardware.faketouch',
  'android.hardware.telephony',
  'android.hardware.camera',
  'android.hardware.camera.autofocus',
  'android.hardware.camera.flash',
  'android.hardware.camera.front',
  'android.hardware.location',
  'android.hardware.location.gps',
  'android.hardware.location.network',
];

module.exports = function withChromebookSupport(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    manifest['uses-feature'] = manifest['uses-feature'] || [];

    for (const name of FEATURES_NOT_REQUIRED) {
      const existing = manifest['uses-feature'].find(
        (f) => f.$ && f.$['android:name'] === name,
      );
      if (existing) {
        existing.$['android:required'] = 'false';
      } else {
        manifest['uses-feature'].push({
          $: { 'android:name': name, 'android:required': 'false' },
        });
      }
    }

    return config;
  });
};
