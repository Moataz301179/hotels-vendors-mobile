module.exports = ({ config }) => ({
  ...config,
  expo: {
    owner: "hotelsvendors.com",
    name: "HOVIN",
    slug: "hovin",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "dark",
    scheme: "hovin",
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.hotelsvendors.hovin",
      associatedDomains: ["applinks:hotelsvendors.com"],
      infoPlist: {
        NSCameraUsageDescription: "HOVIN needs camera access to scan product barcodes for controlled receiving and physical counts.",
        NSPhotoLibraryUsageDescription: "HOVIN needs photo library access to select invoice images.",
        NSUserNotificationUsageDescription: "HOVIN needs permission to send you order and payment updates.",
        NSAppleEventsUsageDescription: "HOVIN needs permission to handle payment callback links.",
        ITSAppUsesNonExemptEncryption: false,
        CFBundleURLTypes: [
          { CFBundleURLSchemes: ["hovin"] },
        ],
      },
    },
    android: {
      package: "com.hotelsvendors.hovin",
      versionCode: 1,
      adaptiveIcon: {
        backgroundColor: "#0A0E1A",
        foregroundImage: "./assets/android-icon-foreground.png",
        backgroundImage: "./assets/android-icon-background.png",
        monochromeImage: "./assets/android-icon-monochrome.png",
      },
      permissions: [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
        "POST_NOTIFICATIONS",
        "VIBRATE",
      ],
      predictiveBackGestureEnabled: true,
      intentFilters: [
        {
          action: "VIEW",
          autoVerify: true,
          data: [
            { scheme: "hovin", host: "*", pathPrefix: "/" },
          ],
          category: ["BROWSABLE", "DEFAULT"],
        },
      ],
    },
    web: {
      favicon: "./assets/favicon.png",
    },
    extra: {
      eas: {
        projectId: "ec9544d2-fb7d-4806-95b3-dae26d8893e9",
      },
    },
    plugins: [
      "expo-font",
      "expo-secure-store",
      "@clerk/expo",
      ["expo-camera", {
        cameraPermission: "HOVIN uses the camera to scan product barcodes for controlled receiving and physical counts.",
        recordAudioAndroid: false,
      }],
    ],
  },
});
