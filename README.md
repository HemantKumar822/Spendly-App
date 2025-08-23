# 📱 Spendly - Student Expense Tracker

A clean, Apple-inspired mobile app for college students to track daily expenses, set budgets, and get AI-powered insights.

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- Expo CLI (`npm install -g @expo/cli`)
- Expo Go app on your mobile device

### Installation

1. **Install Dependencies**
   ```bash
   npm install @react-native-async-storage/async-storage date-fns
   ```

2. **Set up Environment (Optional)**
   ```bash
   cp .env.example .env
   # Edit .env and add your OpenRouter API key for AI features
   ```

3. **Start Development Server**
   ```bash
   npm start
   ```

4. **Test on Mobile Device**
   - Install Expo Go from App Store/Google Play
   - Scan QR code from terminal with Expo Go app
   - Or press 'w' to open web version

## 📱 Testing Instructions

### Expo Go Testing
1. **Download Expo Go** on your phone
2. **Run the dev server** with `npm start`
3. **Scan QR code** displayed in terminal
4. **Test core features**:
   - Add expenses with different categories
   - View dashboard with real-time updates
   - Check summary with period switching
   - Create and monitor budgets

### Features to Test

#### ✅ Dashboard Screen
- [ ] Today's spending summary
- [ ] Week overview with average
- [ ] Recent transactions list
- [ ] Empty state when no expenses
- [ ] Pull-to-refresh functionality

#### ✅ Add Expense Screen  
- [ ] Amount input with currency symbol
- [ ] Description input with validation
- [ ] Category selection with visual feedback
- [ ] AI categorization (if API key configured)
- [ ] Optional notes field
- [ ] Save functionality with success feedback

#### ✅ Summary Screen
- [ ] Period selector (Today/Week/Month)
- [ ] Category breakdown chart
- [ ] Top expenses list
- [ ] Empty state handling
- [ ] Refresh functionality

#### ✅ Budget Screen
- [ ] Create new budget (weekly/monthly)
- [ ] Category-specific or total budgets
- [ ] Progress visualization with colors
- [ ] Over-budget warnings
- [ ] Delete budget functionality

### Platform Testing
- **iOS**: Test in Expo Go on iPhone/iPad
- **Android**: Test in Expo Go on Android device  
- **Web**: Press 'w' in terminal to open browser version

## 🎯 Core Features

### Phase 1 (Current) - Local Storage
- ✅ Expense logging with categories
- ✅ Budget management and tracking
- ✅ Summary charts and insights
- ✅ AI-powered categorization (optional)
- ✅ Clean, Apple-inspired UI
- ✅ Local data storage with AsyncStorage

### Phase 2 (Future)
- [ ] Supabase authentication
- [ ] Cloud data synchronization
- [ ] Export data functionality
- [ ] Group expense splitting
- [ ] Gamification features

## 🛠️ Technical Stack

- **Frontend**: React Native + Expo
- **Navigation**: Expo Router with tabs
- **Storage**: AsyncStorage (Phase 1)
- **AI**: OpenRouter API (optional)
- **Charts**: Custom implementation
- **Styling**: Apple-inspired design system

## 🎨 Design System

### Colors
- **Primary**: #4ECDC4 (Teal)
- **Success**: #96CEB4 (Green)  
- **Warning**: #FFEAA7 (Yellow)
- **Error**: #E53E3E (Red)
- **Background**: #F8F9FA (Light Gray)
- **Text**: #2D3748 (Dark Gray)

### Typography
- **Headers**: Bold, 28-32px
- **Body**: Medium, 16px
- **Captions**: Regular, 12-14px

## 🔧 Development Commands

```bash
# Start development server
npm start

# Start for specific platform
npm run android
npm run ios  
npm run web

# Reset project (if needed)
npm run reset-project

# Lint code
npm run lint
```

## 📝 Project Structure

```
Spendly/
├── app/                    # Expo Router pages
│   ├── (tabs)/            # Tab navigation screens
│   │   ├── index.tsx      # Dashboard
│   │   ├── add-expense.tsx # Add Expense
│   │   ├── summary.tsx    # Summary & Charts
│   │   └── budget.tsx     # Budget Management
│   └── _layout.tsx        # Root layout
├── types/                 # TypeScript definitions
├── services/              # API and storage services
├── utils/                 # Helper functions
└── components/            # Reusable UI components
```

## 🚨 Troubleshooting

### Common Issues
1. **"Cannot resolve @react-native-async-storage"**
   - Run: `npm install @react-native-async-storage/async-storage`

2. **"Cannot resolve date-fns"**  
   - Run: `npm install date-fns`

3. **QR Code not working**
   - Ensure phone and computer are on same WiFi
   - Try pressing 'r' to reload or 'c' to clear cache

4. **AI categorization not working**
   - Check if OpenRouter API key is set in `.env`
   - App works without AI (uses rule-based categorization)

## 🤝 Contributing

This is a demo project built for learning purposes. The app showcases:
- Modern React Native development with Expo
- Clean architecture with TypeScript  
- Local-first data storage
- AI integration for enhanced UX
- Apple-inspired UI/UX design

## 📄 License

This project is for educational purposes. Feel free to use and modify as needed.