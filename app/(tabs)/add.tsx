import { Picker } from '@react-native-picker/picker';
import { useIsFocused } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { getData, Loan, saveData, User } from '../utils/storage';

export default function AddLoanScreen() {
  const isFocused = useIsFocused();
  const [users, setUsers] = useState<User[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);

  // Formulario
  const [selectedUserId, setSelectedUserId] = useState('new');
  const [newUserName, setNewUserName] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [concept, setConcept] = useState('');
  const [initialDebt, setInitialDebt] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isFocused) {
      getData('users').then(setUsers);
      getData('loans').then(setLoans);
    }
  }, [isFocused]);

  const handleSubmit = async () => {
    if (!initialDebt || parseFloat(initialDebt) <= 0 || !concept) {
      Alert.alert('Error', 'Por favor ingresa un concepto y un monto válido.');
      return;
    }

    let finalUserId = selectedUserId;
    let updatedUsers = [...users];

    // 1. Si es un cliente totalmente nuevo, lo creamos
    if (selectedUserId === 'new') {
      if (!newUserName) {
        Alert.alert('Error', 'El nombre del cliente es obligatorio.');
        return;
      }
      finalUserId = Math.random().toString(36).substring(2, 11);
      const newUser: User = {
        id: finalUserId,
        name: newUserName,
        phone: newUserPhone || 'N/A',
        isSynced: false
      };
      updatedUsers.push(newUser);
      await saveData('users', updatedUsers);
      setUsers(updatedUsers);
    }

    // 2. Cálculos Automáticos Basados en las Reglas (24 días - 5% diario)
    const capital = parseFloat(initialDebt);
    const dailyRate = 0.05; // 5% diario
    const totalDays = 24;

    const dailyPaymentAmount = capital * dailyRate; // Cuota fija diaria (5%)
    const totalInterest = dailyPaymentAmount * totalDays; // Interés total en los 24 días
    const totalToPayAmount = capital + totalInterest; // Gran Total a recuperar

    // Fechas automáticas (Hoy y en 24 días)
    const creationDate = new Date();
    const limitDate = new Date();
    limitDate.setDate(creationDate.getDate() + totalDays);

    // 3. Crear el nuevo préstamo asociado al usuario (Permite múltiples préstamos por ID)
    const newLoan: Loan = {
      id: Math.random().toString(36).substring(2, 11),
      userId: finalUserId,
      title: concept,
      initialDebt: capital,
      totalToPay: totalToPayAmount,
      currentBalance: totalToPayAmount, // Inicia debiendo el total con interés
      dailyPayment: dailyPaymentAmount,
      createdAt: creationDate.toISOString(),
      dueDate: limitDate.toISOString(),
      notes: notes,
      history: [],
      isLockedByOverdue: false,
      isSynced: false
    };

    const updatedLoans = [...loans, newLoan];
    await saveData('loans', updatedLoans);
    setLoans(updatedLoans);

    // Limpiar Formulario manteniendo el estado consistente
    setNewUserName('');
    setNewUserPhone('');
    setConcept('');
    setInitialDebt('');
    setNotes('');
    setSelectedUserId('new');

    Alert.alert(
      'Préstamo Registrado', 
      `Plan de 24 días generado.\nCuota Diaria (5%): $${dailyPaymentAmount.toFixed(2)}\nTotal con interés: $${totalToPayAmount.toFixed(2)}`
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.label}>Seleccionar Cliente existente o crear uno nuevo:</Text>
      <View style={styles.pickerContainer}>
        <Picker selectedValue={selectedUserId} onValueChange={(item) => setSelectedUserId(item)}>
          <Picker.Item label="➕ Crear y Registrar Cliente Nuevo" value="new" />
          {users.map(u => (
            <Picker.Item key={u.id} label={`👤 ${u.name} (ID: ${u.id.substring(0,4)})`} value={u.id} />
          ))}
        </Picker>
      </View>

      {selectedUserId === 'new' && (
        <View style={styles.newClientBox}>
          <Text style={styles.label}>Nombre Completo del Cliente *</Text>
          <TextInput style={styles.input} value={newUserName} onChangeText={setNewUserName} placeholder="Ej: Juan Pérez" />
          
          <Text style={styles.label}>Teléfono de Contacto</Text>
          <TextInput style={styles.input} value={newUserPhone} onChangeText={setNewUserPhone} placeholder="Ej: 2221234567" keyboardType="phone-pad" />
        </View>
      )}

      <Text style={styles.label}>Concepto o Identificador del Préstamo *</Text>
      <TextInput style={styles.input} value={concept} onChangeText={setConcept} placeholder="Ej: Préstamo mercancía / Segundo Préstamo" />

      <Text style={styles.label}>Monto de Capital Solicitado ($) *</Text>
      <TextInput style={styles.input} value={initialDebt} onChangeText={setInitialDebt} keyboardType="numeric" placeholder="Ej: 1000" />

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>💡 **Regla Automática Aplicada:**</Text>
        <Text style={styles.infoText}>• Plazo forzoso: 24 días hábiles/corrientes.</Text>
        <Text style={styles.infoText}>• Rendimiento/Cobro: 5% diario sobre la base.</Text>
      </View>

      <Text style={styles.label}>Notas o Avales</Text>
      <TextInput style={[styles.input, { height: 60 }]} value={notes} onChangeText={setNotes} placeholder="Detalles adicionales..." multiline />

      <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
        <Text style={styles.submitBtnText}>Otorgar Préstamo</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: '#fff' },
  label: { fontWeight: 'bold', marginTop: 12, marginBottom: 5, color: '#222' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 10, backgroundColor: '#fafafa' },
  pickerContainer: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, marginBottom: 15, backgroundColor: '#f0f0f0' },
  newClientBox: { backgroundColor: '#f4e6ff', padding: 12, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#dca8ff' },
  infoBox: { backgroundColor: '#e8f4fd', padding: 12, borderRadius: 8, marginVertical: 10 },
  infoText: { color: '#00539c', fontSize: 13, lineHeight: 18 },
  submitBtn: { backgroundColor: '#BD38FF', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 20, marginBottom: 50 },
  submitBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});