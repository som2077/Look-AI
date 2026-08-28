import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export function InlineDatePickerCard({ data, onConfirm }: { data: any, onConfirm: (date: string, time?: string) => void }) {
  const { prompt_label, occasion, pre_selected_date } = data;
  // Simple state for demo purposes. In real app, use a real Date picker library.
  const [selectedDay, setSelectedDay] = useState(11); 

  // Simple static month calendar layout for visual matching
  const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  
  // Generating a simple 30 day grid for layout purposes
  const grid = Array.from({length: 35}, (_, i) => i + 1 - 2); // Start some days negative for previous month

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.promptText}>{prompt_label}</Text>
        
        <View style={styles.header}>
          <Text style={styles.monthText}>August, 2026</Text>
          <View style={styles.arrows}>
            <Text style={styles.arrowText}>{'<'}</Text>
            <Text style={styles.arrowText}>{'>'}</Text>
          </View>
        </View>

        <View style={styles.daysHeader}>
          {days.map(d => <Text key={d} style={styles.dayHeaderText}>{d}</Text>)}
        </View>

        <View style={styles.grid}>
          {grid.map((num, i) => {
            const isCurrentMonth = num > 0 && num <= 31;
            const isSelected = isCurrentMonth && num === selectedDay;
            
            return (
              <TouchableOpacity 
                key={i} 
                style={[styles.gridCell, isSelected && styles.selectedCell]}
                onPress={() => isCurrentMonth && setSelectedDay(num)}
              >
                <Text style={[
                  styles.cellText, 
                  !isCurrentMonth && styles.fadedText,
                  isSelected && styles.selectedText
                ]}>
                  {num > 0 ? (num > 31 ? num - 31 : num) : 31 + num}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>

        <TouchableOpacity 
          style={styles.confirmBtn} 
          onPress={() => onConfirm(`2026-08-${selectedDay.toString().padStart(2, '0')}`, '19:00')}
        >
          <Text style={styles.confirmBtnText}>Confirm Date</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, marginBottom: 12 },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 20,
    width: '100%',
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  promptText: { fontSize: 16, fontWeight: '600', marginBottom: 16, color: '#333' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' },
  monthText: { fontSize: 18, fontWeight: '700', color: '#333' },
  arrows: { flexDirection: 'row', gap: 16 },
  arrowText: { fontSize: 18, color: '#666' },
  daysHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  dayHeaderText: { fontSize: 10, color: '#888', width: 30, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridCell: { 
    width: 30, 
    height: 30, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 8,
    borderRadius: 15,
  },
  selectedCell: { backgroundColor: '#F05A28' }, // Orange from image
  cellText: { fontSize: 14, color: '#333' },
  fadedText: { color: '#CCC' },
  selectedText: { color: '#FFF', fontWeight: 'bold' },
  confirmBtn: {
    marginTop: 16,
    backgroundColor: '#000',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmBtnText: { color: '#FFF', fontSize: 16, fontWeight: '600' }
});
