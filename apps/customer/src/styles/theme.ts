import { Platform } from "react-native";

export const colors = {
  ink: "#101827",
  inkMuted: "#536071",
  gold: "#B98745",
  goldDark: "#8E6535",
  paper: "#F6F7F9",
  surface: "#FFFFFF",
  line: "#E1E5EA",
  success: "#2E8B57",
  danger: "#B42318",
  mist: "#EEF2F6",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 6,
  md: 8,
  lg: 8,
};

export const shadow = Platform.select({
  ios: {
    shadowColor: colors.ink,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  android: {
    elevation: 3,
  },
  default: {},
});
