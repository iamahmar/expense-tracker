// navigation/AppNavigator.jsx
import React, {  useRef, useEffect, useCallback , useMemo } from 'react';
import {
  View, Text, StyleSheet, Platform,
  Animated, Pressable, Dimensions,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  useTheme, Typography, Spacing, Radius, Shadow, Animation,
} from '../theme';
import HomeScreen from '../screens/HomeScreen';
import AddExpenseScreen from '../screens/AddExpenseScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import TransactionDetailScreen from '../screens/TransactionDetailScreen';
import { AppProvider } from '../context/AppContext';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Screen transition config ─────────────────────────────────────────────────
const get_SLIDE_OPTIONS = (Colors) => ({
  headerShown: false,
  animation: 'ios_from_right',
  customAnimationOnGesture: true,
  gestureEnabled: true,
  gestureDirection: 'horizontal',
  contentStyle: { backgroundColor: Colors.bg },
});

const get_MODAL_OPTIONS = (Colors) => ({
  headerShown: false,
  animation: 'slide_from_bottom',
  presentation: 'modal',
  gestureEnabled: true,
  contentStyle: { backgroundColor: Colors.bg },
});

// ─── Tab definitions ──────────────────────────────────────────────────────────
const TABS = [
  { name: 'Home', icon: 'home', iconFocused: 'home', label: 'Home' },
  { name: 'Analytics', icon: 'bar-chart', iconFocused: 'bar-chart', label: 'Analytics' },
  { name: 'Add', icon: 'add', iconFocused: 'add', label: null }, // FAB — no label
  { name: 'Settings', icon: 'settings', iconFocused: 'tune', label: 'Settings' },
];

// ─── Animated Tab Button ──────────────────────────────────────────────────────
function TabButton({ tab, focused, onPress, onLongPress }) {
  const Colors = useTheme();
  const styles = useMemo(() => get_styles(Colors), [Colors]);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(focused ? 1 : 0.5)).current;
  const bgAnim = useRef(new Animated.Value(focused ? 1 : 0)).current;
  const dotAnim = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(bgAnim, { toValue: focused ? 1 : 0, ...Animation.springSnappy }),
      Animated.spring(dotAnim, { toValue: focused ? 1 : 0, ...Animation.springBouncy }),
      Animated.timing(opacityAnim, { toValue: focused ? 1 : 0.45, duration: Animation.base, useNativeDriver: true }),
    ]).start();
  }, [focused]);

  const handlePress = () => {
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: Animation.pressScale, ...Animation.springSnappy }),
      Animated.spring(scaleAnim, { toValue: 1, ...Animation.springBouncy }),
    ]).start();
    onPress();
  };

  // ── FAB (centre button) ──
  if (tab.name === 'Add') {
    return (
      <Pressable onPress={handlePress} onLongPress={onLongPress} style={styles.fabWrap}>
        <Animated.View style={[styles.fab, { transform: [{ scale: scaleAnim }] }]}>
          <MaterialIcons name="add" size={28} color="#fff" />
        </Animated.View>
      </Pressable>
    );
  }

  // ── Regular tab ──
  const bgColor = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255,107,53,0)', Colors.accentMuted],
  });

  const dotScale = dotAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const dotOpacity = dotAnim;

  return (
    <Pressable onPress={handlePress} onLongPress={onLongPress} style={styles.tabBtnOuter}>
      <Animated.View style={[styles.tabBtn, { transform: [{ scale: scaleAnim }] }]}>
        {/* Pill background */}
        <Animated.View style={[styles.tabPill, { backgroundColor: bgColor }]} />

        {/* Icon */}
        <Animated.View style={{ opacity: opacityAnim }}>
          <MaterialIcons
            name={focused ? tab.iconFocused : tab.icon}
            size={22}
            color={focused ? Colors.tabActive : Colors.tabInactive}
          />
        </Animated.View>

        {/* Label */}
        {tab.label && (
          <Animated.Text
            style={[
              styles.tabLabel,
              { color: focused ? Colors.tabActive : Colors.tabInactive, opacity: opacityAnim },
            ]}
          >
            {tab.label}
          </Animated.Text>
        )}

        {/* Active indicator dot */}
        <Animated.View style={[
          styles.activeDot,
          { transform: [{ scale: dotScale }], opacity: dotOpacity },
        ]} />
      </Animated.View>
    </Pressable>
  );
}

// ─── Custom Tab Bar ───────────────────────────────────────────────────────────
function CustomTabBar({ state, descriptors, navigation }) {
  const Colors = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => get_styles(Colors, insets), [Colors, insets]);

  return (
    <View style={styles.tabBarOuter}>
      {/* Blur/glass layer */}
      <View style={styles.tabBarInner}>
        {/* Top border accent line */}
        <View style={styles.tabBarAccentLine} />

        <View style={styles.tabBarRow}>
          {state.routes.map((route, index) => {
            const tab = TABS.find(t => t.name === route.name) || TABS[0];
            const focused = state.index === index;
            const { options } = descriptors[route.key];

            const onPress = () => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };
            const onLongPress = () => {
              navigation.emit({ type: 'tabLongPress', target: route.key });
            };

            return (
              <TabButton
                key={route.key}
                tab={tab}
                focused={focused}
                onPress={onPress}
                onLongPress={onLongPress}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}

// ─── Stacks ───────────────────────────────────────────────────────────────────
function HomeStack() {
  const Colors = useTheme();
  const styles = useMemo(() => get_styles(Colors), [Colors]);

  return (
    <Stack.Navigator screenOptions={get_SLIDE_OPTIONS(Colors)}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="TransactionDetail" component={TransactionDetailScreen} />
    </Stack.Navigator>
  );
}

function AnalyticsStack() {
  const Colors = useTheme();
  const styles = useMemo(() => get_styles(Colors), [Colors]);

  return (
    <Stack.Navigator screenOptions={get_SLIDE_OPTIONS(Colors)}>
      <Stack.Screen name="AnalyticsMain" component={AnalyticsScreen} />
    </Stack.Navigator>
  );
}

function SettingsStack() {
  const Colors = useTheme();
  const styles = useMemo(() => get_styles(Colors), [Colors]);

  return (
    <Stack.Navigator screenOptions={get_SLIDE_OPTIONS(Colors)}>
      <Stack.Screen name="SettingsMain" component={SettingsScreen} />
    </Stack.Navigator>
  );
}

// ─── Tab Navigator ────────────────────────────────────────────────────────────
function TabNavigator() {
  const Colors = useTheme();
  const styles = useMemo(() => get_styles(Colors), [Colors]);

  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Analytics" component={AnalyticsStack} />
      {/* <Tab.Screen name="History" component={HomeStack} /> */}
      <Tab.Screen name="Settings" component={SettingsStack} />
    </Tab.Navigator>
  );
}

// ─── Root Navigator ───────────────────────────────────────────────────────────
function RootNavigator() {
  const Colors = useTheme();
  const styles = useMemo(() => get_styles(Colors), [Colors]);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={TabNavigator} />
      <Stack.Screen
        name="AddExpenseModal"
        component={AddExpenseScreen}
        options={get_MODAL_OPTIONS(Colors)}
      />
    </Stack.Navigator>
  );
}

// ─── App Entry ────────────────────────────────────────────────────────────────
export default function AppNavigator() {
  const Colors = useTheme();
  const styles = useMemo(() => get_styles(Colors), [Colors]);

  return (
    <GestureHandlerRootView style={styles.root}>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const TAB_HEIGHT_IOS = 82;
const TAB_HEIGHT_ANDROID = 68;
const TAB_HEIGHT = Platform.OS === 'ios' ? TAB_HEIGHT_IOS : TAB_HEIGHT_ANDROID;

const get_styles = (Colors, insets = { bottom: 0 }) => StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },

  // ── Tab bar shell ──
  tabBarOuter: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    // Safe-area padding
    paddingBottom: insets.bottom > 0 ? insets.bottom : (Platform.OS === 'ios' ? 24 : 12),
    backgroundColor: 'transparent',
  },
  tabBarInner: {
    marginHorizontal: 12,
    marginBottom: Platform.OS === 'ios' ? 8 : 10,
    backgroundColor: Colors.tabBg,
    borderRadius: Radius.xxl,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    overflow: 'hidden',
    ...Shadow.lg,
  },

  // Thin accent line along the top of the bar
  tabBarAccentLine: {
    height: 1,
    marginHorizontal: 24,
    backgroundColor: Colors.accentDim,
    borderRadius: 1,
  },

  tabBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: Platform.OS === 'ios' ? 60 : 58,
    paddingHorizontal: 4,
  },

  // ── Regular tab button ──
  tabBtnOuter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  tabBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 52,
    gap: 2,
  },
  tabPill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: Radius.lg,
    marginHorizontal: -10,
    marginVertical: -4,
  },
  tabLabel: {
    fontFamily: Typography.medium,
    fontSize: 10,
    letterSpacing: 0.2,
  },
  activeDot: {
    position: 'absolute',
    bottom: -6,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.accent,
  },

  // ── FAB (centre) ──
  fabWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Platform.OS === 'ios' ? 2 : 0,
    ...Shadow.accent,
    // Subtle inner highlight
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
});