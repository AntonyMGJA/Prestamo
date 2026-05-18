import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { getData, Loan, User } from '../utils/storage';

export default function PaidScreen() {
  const isFocused = useIsFocused();
  const [users, setUsers] = useState<User[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);

  useEffect(() => {
    if (isFocused) {
      getData('users').then(setUsers);
      getData('loans').then(setLoans);
    }
  }, [isFocused]);

  const paidLoans = loans.filter(l => l.currentBalance <= 0);

  return (
    <View style={styles.container}>
      {paidLoans.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.mutedText}>Aún no hay deudores con la deuda saldada.</Text>
        </View>
      ) : (
        <FlatList
          data={paidLoans}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const user = users.find(u => u.id === item.userId) || { name: item.title };
            return (
              <View style={styles.card}>
                <Ionicons name="checkmark-circle" size={40} color="#2dd36f" />
                <View style={{ marginLeft: 10, flex: 1 }}>
                  <Text style={styles.name}>{user.name} <Text style={styles.small}>({item.title})</Text></Text>
                  <Text style={styles.successText}>Deuda Saldada</Text>
                  <Text style={styles.small}>Total Inicial: ${item.initialDebt.toFixed(2)}</Text>
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9', padding: 10 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  mutedText: { color: '#888' },
  card: { flexDirection: 'row', backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10, alignItems: 'center' },
  name: { fontSize: 16, fontWeight: 'bold' },
  successText: { color: '#2dd36f', fontWeight: '600', marginVertical: 2 },
  small: { fontSize: 12, color: '#666' }
});