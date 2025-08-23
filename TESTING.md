# 📋 Spendly Testing Checklist

Use this checklist to systematically test the Spendly app on your mobile device via Expo Go.

## 📱 Pre-Testing Setup

- [ ] Install Expo Go app on your mobile device
- [ ] Ensure phone and computer are on the same WiFi network
- [ ] Run `npm start` in the Spendly project directory
- [ ] Scan QR code with Expo Go app
- [ ] App loads successfully without errors

## 🏠 Dashboard Screen Testing

### Initial Load
- [ ] App opens to Dashboard screen
- [ ] "Welcome to Spendly" header displays correctly
- [ ] Current date shows properly
- [ ] Today's spending shows ₹0.00 initially
- [ ] "No expenses today" empty state appears

### Navigation
- [ ] Bottom tab bar is visible and functional
- [ ] Dashboard tab is highlighted/active
- [ ] Can switch to other tabs and back

### UI Elements
- [ ] Cards have proper shadows and rounded corners
- [ ] Icons display correctly (MaterialIcons)
- [ ] Colors match design (teal accents, white cards)
- [ ] Text is readable and properly sized
- [ ] Pull-to-refresh works smoothly

## ➕ Add Expense Screen Testing

### Form Validation
- [ ] Amount field only accepts numbers
- [ ] Currency symbol (₹) displays correctly
- [ ] Description field has character limit (100)
- [ ] Category selection is required
- [ ] Error messages display for invalid inputs

### Category Selection
- [ ] 10 default categories display in grid
- [ ] Each category shows emoji and name
- [ ] Selection highlights category with teal border
- [ ] Categories are visually distinct

### AI Features (if API key configured)
- [ ] "AI Suggest" button appears when description and amount filled
- [ ] AI categorization works and selects appropriate category
- [ ] Loading state shows during AI processing
- [ ] Falls back gracefully if AI fails

### Save Functionality
- [ ] Save button disabled when form invalid
- [ ] Success alert shows after saving
- [ ] Option to "Add Another" or "Go to Dashboard"
- [ ] Form resets properly for new expense

## 📊 Summary Screen Testing

### Period Selection
- [ ] Three period buttons: Today, This Week, This Month
- [ ] Active period highlighted with white background
- [ ] Data updates when switching periods
- [ ] Smooth transitions between periods

### Charts and Data
- [ ] Total amount displays prominently
- [ ] Category breakdown shows as horizontal bars
- [ ] Colors match category colors from Add screen
- [ ] Percentages calculate correctly
- [ ] Empty state shows when no data

### Top Expenses
- [ ] Shows largest expenses for selected period
- [ ] Displays expense description, category, and amount
- [ ] Date formatting is readable (e.g., "Jan 15")
- [ ] Limited to top 5 expenses

## 💰 Budget Screen Testing

### Empty State
- [ ] "No budgets yet" message shows initially
- [ ] Wallet icon displays prominently
- [ ] "Create Your First Budget" button works

### Create Budget Modal
- [ ] Modal slides up from bottom smoothly
- [ ] Amount input accepts only numbers
- [ ] Weekly/Monthly period selection works
- [ ] Category selection includes "All Categories" option
- [ ] Close button (X) dismisses modal

### Budget Cards
- [ ] Shows category icon and name (or "All Categories")
- [ ] Progress bar fills according to spending percentage
- [ ] Colors change based on progress (green → yellow → red)
- [ ] "Over budget" warnings display correctly
- [ ] Days remaining calculation is accurate

### Budget Management  
- [ ] Delete button shows confirmation dialog
- [ ] Budgets update in real-time as expenses added
- [ ] Multiple budgets can exist simultaneously

## 🔄 Cross-Screen Integration Testing

### Data Persistence
- [ ] Add expense from Add screen
- [ ] Check Dashboard updates immediately
- [ ] Verify Summary screen reflects new expense
- [ ] Confirm Budget progress updates if applicable
- [ ] Data persists after app reload/restart

### Navigation Flow
- [ ] Add expense → Dashboard shows updated data
- [ ] Dashboard → Summary shows consistent totals
- [ ] Budget creation → Dashboard reflects budget progress
- [ ] All tabs accessible from any screen

## 📱 Mobile-Specific Testing

### Performance
- [ ] Smooth scrolling on all screens
- [ ] Quick response to taps and gestures
- [ ] No lag when switching tabs
- [ ] Form inputs respond immediately

### UI/UX on Mobile
- [ ] Text is readable without zooming
- [ ] Touch targets are appropriately sized
- [ ] Keyboard behavior is natural (numeric for amounts)
- [ ] Safe area respected (no content behind notches)
- [ ] App works in both portrait orientations

### Device Compatibility
Test on different screen sizes if available:
- [ ] Small screens (iPhone SE, small Android)  
- [ ] Large screens (iPhone Plus, large Android)
- [ ] Tablets (iPad, Android tablets)

## 🐛 Error Handling Testing

### Network/Storage Issues
- [ ] App works offline (local storage only)
- [ ] Graceful handling of storage errors
- [ ] AI features fail gracefully without API key

### Edge Cases
- [ ] Very large expense amounts (₹999,999+)
- [ ] Very long expense descriptions
- [ ] Special characters in descriptions
- [ ] Rapid tapping/interaction doesn't break UI

### Data Edge Cases
- [ ] Zero amount expenses (should reject)
- [ ] Negative amounts (should reject)
- [ ] Expenses on different dates
- [ ] Budget periods crossing months/years

## ✅ Final Verification

- [ ] All core features work as expected
- [ ] App feels responsive and polished
- [ ] No critical bugs or crashes
- [ ] Data saves and loads correctly
- [ ] Ready for production use

## 📝 Test Results

**Date Tested**: ________________  
**Device**: ________________  
**OS Version**: ________________  
**Issues Found**: ________________  

**Overall Rating**: ⭐⭐⭐⭐⭐ (Rate 1-5 stars)

**Notes**:
_Use this space to record any observations, suggestions, or issues found during testing._