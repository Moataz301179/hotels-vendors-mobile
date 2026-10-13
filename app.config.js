module.exports = ({ config }) => ({
  ...config,
  expo: {
    owner: "hotelsvendors.com",
    name: "HOVIN",
    slug: "hovin",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    scheme: "hovin",
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.hotelsvendors.hovin",
      associatedDomains: ["applinks:hotelsvendors.com"],
      entitlements: {
        "keychain-access-groups": ["$(AppIdentifierPrefix)$(CFBundleIdentifier)"],
      },
      infoPlist: {
        NSCameraUsageDescription: "HOVIN needs camera access to photograph invoices for financing.",
        NSPhotoLibraryUsageDescription: "HOVIN needs photo library access to select invoice images.",
        NSUserNotificationUsageDescription: "HOVIN needs permission to send you order and payment updates.",
        NSAppleEventsUsageDescription: "HOVIN needs permission to handle payment callback links.",
        ITSAppUsesNonExemptEncryption: false,
        CFBundleURLTypes: [
          { CFBundleURLSchemes: ["hovin", "eta"] },
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
            { scheme: "eta", host: "*", pathPrefix: "/" },
          ],
          category: ["BROWSABLE", "DEFAULT"],
        },
      ],
    },
    web: {
      favicon: "./assets/favicon.png",
    },
    // EAS project identity is created for the `hovin` slug below. Do not
    // carry forward the legacy `invo` project id.
    extra: { eas: { projectId: "ec9544d2-fb7d-4806-95b3-dae26d8893e9" } },
    plugins: ["expo-font", "expo-secure-store", "expo-web-browser", "@clerk/expo"],
  },
});
