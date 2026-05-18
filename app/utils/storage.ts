// app/utils/storage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  id: string;
  name: string;
  phone: string;
  isSynced: boolean;
}

export interface PaymentHistory {
  date: string;
  amount: number;
}

export interface Loan {
  id: string;
  userId: string;
  title: string;
  initialDebt: number;      // El capital prestado original
  totalToPay: number;       // Capital + 5% diario por 24 días (Monto final esperado)
  currentBalance: number;   // Lo que le falta pagar de ese total
  dailyPayment: number;     // Cuánto debe pagar al día (5% del total inicial o tasa fija)
  createdAt: string;        // Fecha de creación
  dueDate: string;          // Fecha límite (createdAt + 24 días)
  notes: string;
  history: PaymentHistory[];
  isLockedByOverdue: boolean; // Si excede los 24 días y el admin lo mantiene cerrado/congelado
  isSynced: boolean;
}

export const getData = async (key: 'users' | 'loans') => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (e) {
    return [];
  }
};

export const saveData = async (key: 'users' | 'loans', data: any) => {
  try {
    const jsonValue = JSON.stringify(data);
    await AsyncStorage.setItem(key, jsonValue);
  } catch (e) {
    console.error(e);
  }
};