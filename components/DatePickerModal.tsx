import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
         addDays, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { useTheme, Theme } from '@/contexts/ThemeContext';

interface DatePickerModalProps {
  visible: boolean;
  selectedDate: Date;
  onClose: () => void;
  onDateSelect: (date: Date) => void;
  maxDate?: Date;
  minDate?: Date;
}

const { width: screenWidth } = Dimensions.get('window');
const calendarWidth = screenWidth - 40;
const dayWidth = calendarWidth / 7;

export default function DatePickerModal({ 
  visible, 
  selectedDate, 
  onClose, 
  onDateSelect, 
  maxDate = new Date(),
  minDate 
}: DatePickerModalProps) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const [currentMonth, setCurrentMonth] = useState(selectedDate);
  
  // Animation values
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  // Handle modal show/hide animations
  useEffect(() => {
    if (visible) {
      // Reset month when modal opens
      setCurrentMonth(selectedDate);
      
      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Reset animations for next show
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
    }
  }, [visible, selectedDate, scaleAnim, fadeAnim]);
  
  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 150,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(prev => subMonths(prev, 1));
  };

  const goToNextMonth = () => {
    const nextMonth = addMonths(currentMonth, 1);
    // Don't allow navigation beyond current month
    if (nextMonth.getTime() <= maxDate.getTime()) {
      setCurrentMonth(nextMonth);
    }
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    onDateSelect(today);
    handleClose();
  };

  const renderHeader = () => {
    return (
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <MaterialIcons name="close" size={24} color={theme.textSecondary} />
        </TouchableOpacity>
        
        <View style={styles.monthNavigation}>
          <TouchableOpacity 
            onPress={goToPreviousMonth}
            style={styles.navButton}
          >
            <MaterialIcons name="chevron-left" size={24} color={theme.primary} />
          </TouchableOpacity>
          
          <Text style={styles.monthTitle}>
            {format(currentMonth, 'MMMM yyyy')}
          </Text>
          
          <TouchableOpacity 
            onPress={goToNextMonth}
            style={[
              styles.navButton,
              addMonths(currentMonth, 1).getTime() > maxDate.getTime() && styles.navButtonDisabled
            ]}
            disabled={addMonths(currentMonth, 1).getTime() > maxDate.getTime()}
          >
            <MaterialIcons 
              name="chevron-right" 
              size={24} 
              color={addMonths(currentMonth, 1).getTime() > maxDate.getTime() ? theme.textTertiary : theme.primary} 
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={goToToday} style={styles.todayButton}>
          <Text style={styles.todayButtonText}>Today</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderDayHeaders = () => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    return (
      <View style={styles.dayHeadersRow}>
        {dayNames.map(day => (
          <View key={day} style={styles.dayHeader}>
            <Text style={styles.dayHeaderText}>{day}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const dateFormat = 'd';
    const rows = [];

    let days = [];
    let day = startDate;
    let formattedDate = '';

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, dateFormat);
        const cloneDay = day;
        const isCurrentMonth = isSameMonth(day, monthStart);
        const isSelected = isSameDay(day, selectedDate);
        const isToday = isSameDay(day, new Date());
        const isDisabled = day > maxDate || (minDate && day < minDate);

        days.push(
          <TouchableOpacity
            key={day.toString()}
            style={[
              styles.dayCell,
              !isCurrentMonth && styles.dayCellOtherMonth,
              isSelected && styles.dayCellSelected,
              isToday && !isSelected && styles.dayCellToday,
              isDisabled && styles.dayCellDisabled,
            ]}
            onPress={() => {
              if (!isDisabled && isCurrentMonth) {
                onDateSelect(cloneDay);
                handleClose();
              }
            }}
            disabled={isDisabled || !isCurrentMonth}
          >
            <Text
              style={[
                styles.dayText,
                !isCurrentMonth && styles.dayTextOtherMonth,
                isSelected && styles.dayTextSelected,
                isToday && !isSelected && styles.dayTextToday,
                isDisabled && styles.dayTextDisabled,
              ]}
            >
              {formattedDate}
            </Text>
          </TouchableOpacity>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <View key={day.toString()} style={styles.calendarRow}>
          {days}
        </View>
      );
      days = [];
    }

    return <View style={styles.calendar}>{rows}</View>;
  };

  const renderQuickActions = () => {
    const today = new Date();
    const yesterday = addDays(today, -1);
    const weekAgo = addDays(today, -7);

    const quickDates = [
      { label: 'Today', date: today },
      { label: 'Yesterday', date: yesterday },
      { label: '1 Week Ago', date: weekAgo },
    ];

    return (
      <View style={styles.quickActions}>
        <Text style={styles.quickActionsTitle}>Quick Select</Text>
        <View style={styles.quickActionsRow}>
          {quickDates.map(({ label, date }) => (
            <TouchableOpacity
              key={label}
              style={[
                styles.quickActionButton,
                isSameDay(date, selectedDate) && styles.quickActionButtonSelected
              ]}
              onPress={() => {
                onDateSelect(date);
                handleClose();
              }}
            >
              <Text style={[
                styles.quickActionText,
                isSameDay(date, selectedDate) && styles.quickActionTextSelected
              ]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      onRequestClose={handleClose}
    >
      <Animated.View 
        style={[
          styles.overlay,
          {
            opacity: fadeAnim,
          }
        ]}
      >
        <TouchableOpacity 
          style={styles.overlayTouch} 
          activeOpacity={1} 
          onPress={handleClose}
        >
          <Animated.View 
            style={[
              styles.modal,
              {
                transform: [
                  {
                    scale: scaleAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1],
                    }),
                  },
                ],
                opacity: scaleAnim,
              }
            ]}
          >
            <TouchableOpacity activeOpacity={1} onPress={() => {}}>
              {renderHeader()}
              {renderDayHeaders()}
              {renderCalendar()}
              {renderQuickActions()}
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

const getStyles = (theme: Theme) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayTouch: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modal: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
    shadowColor: theme.shadow,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  closeButton: {
    padding: 4,
  },
  monthNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navButton: {
    padding: 8,
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
    marginHorizontal: 16,
  },
  todayButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: theme.primary,
    borderRadius: 8,
  },
  todayButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.onPrimary,
  },
  dayHeadersRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: theme.surfaceVariant,
  },
  dayHeader: {
    width: dayWidth,
    alignItems: 'center',
  },
  dayHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.textTertiary,
  },
  calendar: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  calendarRow: {
    flexDirection: 'row',
  },
  dayCell: {
    width: dayWidth,
    height: dayWidth,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 1,
    borderRadius: dayWidth / 2,
  },
  dayCellOtherMonth: {
    opacity: 0.3,
  },
  dayCellSelected: {
    backgroundColor: theme.primary,
  },
  dayCellToday: {
    backgroundColor: theme.primaryContainer,
    borderWidth: 1,
    borderColor: theme.primary,
  },
  dayCellDisabled: {
    opacity: 0.2,
  },
  dayText: {
    fontSize: 16,
    color: theme.text,
  },
  dayTextOtherMonth: {
    color: theme.textTertiary,
  },
  dayTextSelected: {
    color: theme.onPrimary,
    fontWeight: '600',
  },
  dayTextToday: {
    color: theme.primary,
    fontWeight: '600',
  },
  dayTextDisabled: {
    color: theme.border,
  },
  quickActions: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: theme.divider,
  },
  quickActionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textSecondary,
    marginBottom: 12,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    backgroundColor: theme.surfaceVariant,
    borderRadius: 8,
    alignItems: 'center',
  },
  quickActionButtonSelected: {
    backgroundColor: theme.primaryContainer,
    borderWidth: 1,
    borderColor: theme.primary,
  },
  quickActionText: {
    fontSize: 12,
    color: theme.textSecondary,
    fontWeight: '500',
  },
  quickActionTextSelected: {
    color: theme.primary,
    fontWeight: '600',
  },
});
