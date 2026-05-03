# 💰 Expense Tracker — React Native

A fully offline, dark-themed expense tracker built with React Native. Zero backend, zero network calls — all data lives on-device via AsyncStorage.

---

## ✨ Features

| Screen | What's Inside |
|---|---|
| **Home** | Monthly summary card, income/expense/net balance, budget progress bar, filter chips (All / This Week / This Month / Income / Expense), swipe-to-delete transactions |
| **Add Expense** | Expense / Income toggle, amount keypad, title, category grid (7 categories with icons + colors), date picker |
| **Analytics** | Month selector, top 3 spending categories, pie chart (spending by category), bar chart (weekly trend), full category breakdown with progress bars |
| **Settings** | Editable monthly budget with live warning, currency selector (INR / USD / EUR / GBP / AED / JPY), data stats, clear all data with confirmation |
| **Detail View** | Full transaction info accessible from Home list tap |

---

## 🎨 Design System

| Token | Value |
|---|---|
| Background | `#1A1A2E` |
| Surface | `#16213E` |
| Accent (Orange) | `#FF6B35` |
| Income (Teal) | `#4ECDC4` |
| Number font | `Space Mono` |
| Label font | `Outfit` |

All tokens live in `src/theme.js`.

---

## 🗂 Project Structure

```
ExpenseTracker/
├── App.jsx                          # Entry point
├── babel.config.js                  # Reanimated plugin
├── package.json
└── src/
    ├── theme.js                     # Colors, Typography, Spacing, CATEGORIES
    ├── context/
    │   └── AppContext.js            # Global state + AsyncStorage sync
    ├── navigation/
    │   └── AppNavigator.jsx         # Bottom tabs + Stack navigator
    ├── screens/
    │   ├── HomeScreen.jsx           # Dashboard + transaction list
    │   ├── AddExpenseScreen.jsx     # Add transaction form
    │   ├── AnalyticsScreen.jsx      # Charts + breakdown
    │   ├── SettingsScreen.jsx       # Budget, currency, data management
    │   └── TransactionDetailScreen.jsx  # Drill-down view
    └── utils/
        ├── storage.js               # AsyncStorage helpers + CURRENCIES
        └── helpers.js               # Formatters, date filters, aggregations
```

---

## 🚀 Setup

### Prerequisites
- Node.js 18+
- React Native CLI (`npm install -g react-native-cli`)
- For iOS: Xcode 14+ on macOS
- For Android: Android Studio with SDK 33+

### 1. Install dependencies

```bash
npm install
```

### 2. iOS — Link native modules & install pods

```bash
cd ios && pod install && cd ..
```

### 3. Link vector icons

**iOS** — In `ios/ExpenseTracker/Info.plist`, add:
```xml
<key>UIAppFonts</key>
<array>
  <string>MaterialIcons.ttf</string>
  <string>SpaceMono-Regular.ttf</string>
  <string>SpaceMono-Bold.ttf</string>
  <string>Outfit-Light.ttf</string>
  <string>Outfit-Regular.ttf</string>
  <string>Outfit-Medium.ttf</string>
  <string>Outfit-SemiBold.ttf</string>
  <string>Outfit-Bold.ttf</string>
</array>
```

**Android** — In `android/app/build.gradle`, add:
```gradle
apply from: "../../node_modules/react-native-vector-icons/fonts.gradle"
```

### 4. Add custom fonts

Download and add to:
- iOS: `ios/ExpenseTracker/Fonts/`
- Android: `android/app/src/main/assets/fonts/`

Fonts needed:
- **Space Mono**: `SpaceMono-Regular.ttf`, `SpaceMono-Bold.ttf` → [Google Fonts](https://fonts.google.com/specimen/Space+Mono)
- **Outfit**: `Outfit-Light.ttf`, `Outfit-Regular.ttf`, `Outfit-Medium.ttf`, `Outfit-SemiBold.ttf`, `Outfit-Bold.ttf` → [Google Fonts](https://fonts.google.com/specimen/Outfit)

### 5. Run

```bash
# iOS
npx react-native run-ios

# Android
npx react-native run-android
```

---

## 📦 Key Dependencies

| Package | Purpose |
|---|---|
| `@react-native-async-storage/async-storage` | Offline data persistence |
| `@react-navigation/native` + `bottom-tabs` + `native-stack` | Navigation |
| `react-native-gesture-handler` | Swipe-to-delete gestures |
| `react-native-chart-kit` + `react-native-svg` | Pie + bar charts |
| `react-native-vector-icons` | Material Icons |
| `@react-native-community/datetimepicker` | Date picker |
| `react-native-reanimated` | Smooth animations |

---

## 🔧 Customization

### Add a new category
In `src/theme.js`, add to the `CATEGORIES` array:
```js
{ id: 'gym', label: 'Gym', icon: 'fitness-center', color: '#FF6B6B', bg: 'rgba(255,107,107,0.15)' }
```

### Change default budget
In `src/utils/storage.js`, edit `DEFAULT_SETTINGS.monthlyBudget`.

### Add a new currency
In `src/utils/storage.js`, add to the `CURRENCIES` array.

---

## 💾 Data Storage

All data is stored in two AsyncStorage keys:
- `@expense_tracker/transactions` — Array of transaction objects
- `@expense_tracker/settings` — Budget + currency preference

Data survives app restarts, updates, and background kills. Cleared only via Settings → Clear All Data.

### Transaction schema
```js
{
  id: "txn_1704067200000_abc123",   // generated unique ID
  type: "expense" | "income",
  amount: 450.00,                    // number
  title: "Lunch at Cafe",
  category: "food",                  // matches CATEGORIES id
  date: "2024-01-01T12:00:00.000Z", // ISO string
  createdAt: "2024-01-01T12:05:00.000Z"
}
```
