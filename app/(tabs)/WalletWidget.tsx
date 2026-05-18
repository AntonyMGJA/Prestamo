// components/WalletWidget.tsx
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { getData, Loan } from '../utils/storage'; // Ajusta la ruta según tu estructura

interface WalletWidgetProps {
  showDetails?: boolean; // Permite ocultar/mostrar el desglose según la pantalla
}

export default function WalletWidget({ showDetails = true }: WalletWidgetProps) {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [initialFund, setInitialFund] = useState<number>(0);
  const [inputFund, setInputFund] = useState<string>('');

  const loadWalletData = async () => {
    const l = await getData('loans');
    setLoans(l);
    
    const savedFund = await AsyncStorage.getItem('wallet_initial_fund');
    if (savedFund !== null) {
      setInitialFund(parseFloat(savedFund));
      setInputFund(savedFund);
    }
  };

  useEffect(() => {
    loadWalletData();
  }, []);

  const saveInitialFund = async () => {
    const value = parseFloat(inputFund);
    if (isNaN(value) || value < 0) {
      Alert.alert('Error', 'Ingresa un monto de fondo inicial válido.');
      return;
    }
    await AsyncStorage.setItem('wallet_initial_fund', value.toString());
    setInitialFund(value);
    loadWalletData();
    Alert.alert('Éxito', 'Fondo de caja inicial actualizado.');
  };

  // --- Operaciones de Caja ---
  let totalCapitalInStreet = 0;
  let totalInterestGenerated = 0;
  let totalCollectedFromPayments = 0;
  let totalDisbursedLoans = 0;

  loans.forEach(loan => {
    totalDisbursedLoans += loan.initialDebt;
    const interestOfLoan = loan.totalToPay - loan.initialDebt;
    totalInterestGenerated += interestOfLoan;

    const totalPaidInLoan = loan.history.reduce((sum, payment) => sum + payment.amount, 0);
    totalCollectedFromPayments += totalPaidInLoan;

    if (loan.currentBalance > 0) {
      const remainingRatio = loan.currentBalance / loan.totalToPay;
      totalCapitalInStreet += loan.initialDebt * remainingRatio;
    }
  });

  const currentWalletBalance = initialFund + totalCollectedFromPayments - totalDisbursedLoans;

  return (
    <View style={styles.container}>
      {/* Tarjeta Principal de Caja */}
      <View style={[styles.mainCard, currentWalletBalance < 0 ? styles.cardNegative : styles.cardPositive]}>
        <View style={styles.cardHeader}>
          <Ionicons name="wallet" size={24} color="#fff" />
          <Text style={styles.mainLabel}>EFECTIVO EN MONEDERO (CAJA)</Text>
        </View>
        <Text style={styles.mainValue}>${currentWalletBalance.toFixed(2)}</Text>
      </View>

      {/* Desglose Avanzado (Solo si showDetails es true, ideal para Reportes) */}
      {showDetails && (
        <View style={styles.gridRow}>
          <View style={styles.splitCard}>
            <Text style={styles.splitLabel}>Capital en Calle</Text>
            <Text style={[styles.splitValue, { color: '#ff9f0a' }]}>${totalCapitalInStreet.toFixed(2)}</Text>
          </View>

          <View style={styles.splitCard}>
            <Text style={styles.splitLabel}>Ganancia por Rédito</Text>
            <Text style={[styles.splitValue, { color: '#32d74b' }]}>${totalInterestGenerated.toFixed(2)}</Text>
          </View>
        </View>
      )}

      {/* Configuración rápida de fondo si está en modo detalles */}
      {showDetails && (
        <View style={styles.configCard}>
          <Text style={styles.configTitle}>⚙️ Ajustar Caja Inicial</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              placeholder="Base"
              value={inputFund}
              onChangeText={setInputFund}
            />
            <TouchableOpacity style={styles.saveBtn} onPress={saveInitialFund}>
              <Text style={styles.saveBtnText}>Guardar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 15 },
  mainCard: { padding: 15, borderRadius: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3 },
  cardPositive: { backgroundColor: '#8c24e3' },
  cardNegative: { backgroundColor: '#eb445a' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mainLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: 'bold' },
  mainValue: { color: '#fff', fontSize: 26, fontWeight: 'bold', marginTop: 4 },
  
  gridRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  splitCard: { backgroundColor: '#fff', width: '48%', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#eaeaea' },
  splitLabel: { fontSize: 11, color: '#666', fontWeight: '500' },
  splitValue: { fontSize: 16, fontWeight: 'bold', marginTop: 2 },

  configCard: { backgroundColor: '#fff', padding: 10, borderRadius: 10, marginTop: 10, borderWidth: 1, borderColor: '#eaeaea' },
  configTitle: { fontSize: 12, fontWeight: 'bold', color: '#444' },
  inputRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
  input: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 6, paddingHorizontal: 8, height: 36, backgroundColor: '#fafafa' },
  saveBtn: { backgroundColor: '#3dc2ff', paddingHorizontal: 12, justifyContent: 'center', borderRadius: 6 },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 }
});