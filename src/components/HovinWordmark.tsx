import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "@/theme";

type Props = { size?: number };

/** HOVIN wordmark with the brand light-blue dot over the I. */
export default function HovinWordmark({ size = 30 }: Props) {
  const stemHeight = size * 0.72;
  return (
    <View style={styles.row} accessibilityLabel="HOVIN">
      <Text style={[styles.word, { fontSize: size, lineHeight: size * 1.1 }]}>HOV</Text>
      <View style={[styles.i, { width: size * 0.42, height: size * 1.1 }]}>
        <View style={[styles.dot, { width: size * 0.16, height: size * 0.16, borderRadius: size * 0.08, top: size * 0.02 }]} />
        <View style={[styles.stem, { width: size * 0.12, height: stemHeight, borderRadius: size * 0.06, bottom: 0 }]} />
      </View>
      <Text style={[styles.word, { fontSize: size, lineHeight: size * 1.1 }]}>N</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-end" },
  word: { color: colors.text, fontWeight: "800", letterSpacing: 3, fontFamily: "PlusJakartaSans_700Bold" },
  i: { alignItems: "center", justifyContent: "flex-end", marginHorizontal: 1 },
  dot: { position: "absolute", backgroundColor: colors.primary },
  stem: { backgroundColor: colors.text },
});
