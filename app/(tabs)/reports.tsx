import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getData, Loan, PaymentHistory, User } from '../utils/storage';
import WalletWidget from './WalletWidget'; //

interface ExtendedPayment extends PaymentHistory {
  debtorName: string;
  parsedDate: Date;
}

interface DayGroup {
  dateString: string;
  total: number;
  payments: ExtendedPayment[];
}

interface WeekGroup {
  weekNumber: number;
  label: string;
  total: number;
  days: { [key: string]: DayGroup };
}

interface MonthGroup {
  monthLabel: string;
  total: number;
  weeks: { [key: number]: WeekGroup };
}

export default function AdvancedReportsScreen() {
  const isFocused = useIsFocused();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // Estados para controlar qué acordeones están abiertos (guardan las llaves/IDs)
  const [expandedMonths, setExpandedMonths] = useState<{ [key: string]: boolean }>({});
  const [expandedWeeks, setExpandedWeeks] = useState<{ [key: string]: boolean }>({});
  const [expandedDays, setExpandedDays] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    if (isFocused) {
      getData('users').then(setUsers);
      getData('loans').then(setLoans);
    }
  }, [isFocused]);

  // 1. Aplanar y preparar todos los pagos con nombres de deudores
  const allPayments: ExtendedPayment[] = [];
  loans.forEach(loan => {
    const user = users.find(u => u.id === loan.userId) || { name: 'Desconocido' };
    loan.history.forEach(h => {
      allPayments.push({
        ...h,
        debtorName: `${user.name} — ${loan.title}`,
        parsedDate: new Date(h.date),
      });
    });
  });

  // Ordenar pagos del más reciente al más antiguo
  allPayments.sort((a, b) => b.parsedDate.getTime() - a.parsedDate.getTime());

  // 2. Totales globales rápidos (Últimos 7 y 30 días)
  const now = new Date();
  const oneWeekAgo = new Date(); oneWeekAgo.setDate(now.getDate() - 7);
  const oneMonthAgo = new Date(); oneMonthAgo.setDate(now.getDate() - 30);

  const globalWeeklyTotal = allPayments.filter(p => p.parsedDate >= oneWeekAgo).reduce((s, p) => s + p.amount, 0);
  const globalMonthlyTotal = allPayments.filter(p => p.parsedDate >= oneMonthAgo).reduce((s, p) => s + p.amount, 0);

  // 3. Agrupación Jerárquica Avanzada: Mes -> Semana del Mes -> Día
  const cronologicalReport: { [key: string]: MonthGroup } = {};

  allPayments.forEach(p => {
    const pDate = p.parsedDate;
    
    // Obtener identificador del Mes (Ej: "enero de 2026")
    const monthLabel = pDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
    const monthKey = `${pDate.getFullYear()}-${pDate.getMonth()}`;

    // Calcular el número de semana dentro del mes (1 a 5)
    const startOfMonth = new Date(pDate.getFullYear(), pDate.getMonth(), 1);
    const dayOfMonth = pDate.getDate();
    const weekNumber = Math.ceil((dayOfMonth + startOfMonth.getDay()) / 7);

    // Identificador del Día
    const dayKey = pDate.toLocaleDateString('es-ES', { day: 'numeric', month: '2-digit', year: 'numeric' });

    // Inicializar Estructura de Mes
    if (!cronologicalReport[monthKey]) {
      cronologicalReport[monthKey] = { monthLabel: monthLabel.toUpperCase(), total: 0, weeks: {} };
    }
    // Inicializar Estructura de Semana
    if (!cronologicalReport[monthKey].weeks[weekNumber]) {
      cronologicalReport[monthKey].weeks[weekNumber] = {
        weekNumber,
        label: `Semana ${weekNumber}`,
        total: 0,
        days: {}
      };
    }
    // Inicializar Estructura de Día
    if (!cronologicalReport[monthKey].weeks[weekNumber].days[dayKey]) {
      cronologicalReport[monthKey].weeks[weekNumber].days[dayKey] = {
        dateString: dayKey,
        total: 0,
        payments: []
      };
    }

    // Sumar montos
    cronologicalReport[monthKey].total += p.amount;
    cronologicalReport[monthKey].weeks[weekNumber].total += p.amount;
    cronologicalReport[monthKey].weeks[weekNumber].days[dayKey].total += p.amount;
    
    // Insertar el pago en el día correspondiente
    cronologicalReport[monthKey].weeks[weekNumber].days[dayKey].payments.push(p);
  });

  // Funciones de alternancia (Toggle) para los acordeones
  const toggleMonth = (key: string) => {
    setExpandedMonths(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleWeek = (key: string) => {
    setExpandedWeeks(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleDay = (key: string) => {
    setExpandedDays(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.subHeader}><WalletWidget showDetails={false} /></Text>

      {/* Tarjetas de Totales Fijos */}
      <View style={styles.rowCards}>
        <View style={styles.miniCard}>
          <Text style={styles.cardLabel}>Últimos 7 Días</Text>
          <Text style={[styles.cardValue, { color: '#3dc2ff' }]}>${globalWeeklyTotal.toFixed(2)}</Text>
        </View>
        <View style={styles.miniCard}>
          <Text style={styles.cardLabel}>Últimos 30 Días</Text>
          <Text style={[styles.cardValue, { color: '#2dd36f' }]}>${globalMonthlyTotal.toFixed(2)}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Estructura Cronológica de Saldos</Text>

      {Object.keys(cronologicalReport).length === 0 ? (
        <Text style={styles.noData}>No hay un historial de cobros registrado aún.</Text>
      ) : (
        Object.keys(cronologicalReport).map(monthKey => {
          const month = cronologicalReport[monthKey];
          const isMonthOpen = !!expandedMonths[monthKey];

          return (
            <View key={monthKey} style={styles.monthContainer}>
              {/* Nivel 1: El Mes */}
              <TouchableOpacity style={styles.monthHeader} onPress={() => toggleMonth(monthKey)}>
                <View style={styles.headerInfo}>
                  <Ionicons name={isMonthOpen ? "calendar" : "calendar-outline"} size={20} color="#fff" />
                  <Text style={styles.monthTitle}>{month.monthLabel}</Text>
                </View>
                <Text style={styles.monthTotal}>${month.total.toFixed(2)}</Text>
              </TouchableOpacity>

              {/* Contenido del Mes (Semanas) */}
              {isMonthOpen && (
                <View style={styles.monthBody}>
                  {Object.keys(month.weeks).map(weekKey => {
                    const week = month.weeks[parseInt(weekKey)];
                    const fullWeekId = `${monthKey}-w${weekKey}`;
                    const isWeekOpen = !!expandedWeeks[fullWeekId];

                    return (
                      <View key={weekKey} style={styles.weekContainer}>
                        {/* Nivel 2: La Semana */}
                        <TouchableOpacity style={styles.weekHeader} onPress={() => toggleWeek(fullWeekId)}>
                          <Text style={styles.weekTitle}>⚡ {week.label}</Text>
                          <Text style={styles.weekTotal}>Total: ${week.total.toFixed(2)}</Text>
                        </TouchableOpacity>

                        {/* Contenido de la Semana (Días) */}
                        {isWeekOpen && (
                          <View style={styles.weekBody}>
                            {Object.keys(week.days).map(dayKey => {
                              const day = week.days[dayKey];
                              const fullDayId = `${fullWeekId}-d${dayKey}`;
                              const isDayOpen = !!expandedDays[fullDayId];

                              return (
                                <View key={dayKey} style={styles.dayContainer}>
                                  {/* Nivel 3: El Día */}
                                  <TouchableOpacity style={styles.dayHeader} onPress={() => toggleDay(fullDayId)}>
                                    <Text style={styles.dayTitle}>📌 {day.dateString}</Text>
                                    <Text style={styles.dayTotal}>${day.total.toFixed(2)}</Text>
                                  </TouchableOpacity>

                                  {/* Nivel 4: Los Pagos específicos del día */}
                                  {isDayOpen && (
                                    <View style={styles.dayBody}>
                                      {day.payments.map((payment, index) => (
                                        <View key={index} style={styles.paymentRow}>
                                          <View style={{ flex: 1 }}>
                                            <Text style={styles.paymentDebtor}>{payment.debtorName}</Text>
                                            <Text style={styles.paymentTime}>
                                              {payment.parsedDate.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                                            </Text>
                                          </View>
                                          <Text style={styles.paymentAmount}>+${payment.amount.toFixed(2)}</Text>
                                        </View>
                                      ))}
                                    </View>
                                  )}
                                </View>
                              );
                            })}
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })
      )}
      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f5f7', padding: 12 },
  subHeader: { color: '#737373', textAlign: 'center', marginBottom: 15, fontSize: 14 },
  rowCards: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  miniCard: { backgroundColor: '#fff', width: '48%', padding: 15, borderRadius: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, alignItems: 'center' },
  cardLabel: { fontSize: 13, color: '#666', fontWeight: '500' },
  cardValue: { fontSize: 20, fontWeight: 'bold', marginTop: 5 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 12, marginTop: 5 },
  noData: { textAlign: 'center', color: '#888', marginTop: 30, fontSize: 14 },
  
  // Estilos de la estructura jerárquica (Mes -> Semana -> Día -> Transacción)
  monthContainer: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 12, overflow: 'hidden', elevation: 2 },
  monthHeader: { backgroundColor: '#BD38FF', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14 },
  headerInfo: { flexDirection: 'row', alignItems: 'center' },
  monthTitle: { color: '#fff', fontWeight: 'bold', fontSize: 15, marginLeft: 8 },
  monthTotal: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  monthBody: { padding: 8, backgroundColor: '#fafafa' },

  weekContainer: { marginBottom: 6, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#e9e9e9' },
  weekHeader: { backgroundColor: '#eaeaea', flexDirection: 'row', justifyContent: 'space-between', padding: 10, alignItems: 'center' },
  weekTitle: { fontWeight: '700', color: '#444', fontSize: 13 },
  weekTotal: { fontSize: 13, color: '#666', fontWeight: '600' },
  weekBody: { padding: 6, backgroundColor: '#fff' },

  dayContainer: { marginBottom: 4, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, paddingHorizontal: 6 },
  dayTitle: { fontSize: 13, color: '#333', fontWeight: '500' },
  dayTotal: { fontSize: 13, fontWeight: 'bold', color: '#111' },
  dayBody: { backgroundColor: '#f9f9f9', padding: 8, borderRadius: 6, marginVertical: 4 },

  paymentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#eaeaea' },
  paymentDebtor: { fontSize: 13, color: '#222', fontWeight: '400' },
  paymentTime: { fontSize: 11, color: '#888', marginTop: 1 },
  paymentAmount: { fontSize: 13, fontWeight: 'bold', color: '#2dd36f' }
});