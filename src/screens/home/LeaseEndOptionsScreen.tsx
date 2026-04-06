import React, { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { getLease, getLeaseSummary } from '../../api/leaseApi';
import { getStatus } from '../../api/subscriptionApi';
import { ErrorMessage } from '../../components/ErrorMessage';
import { PremiumGate } from '../../components/PremiumGate';
import { useTheme } from '../../theme';
import type { HomeStackNavigationProp, HomeStackParamList } from '../../navigation/types';

type LeaseEndOptionsRouteProp = RouteProp<HomeStackParamList, 'LeaseEndOptions'>;

const DEFAULT_OVERAGE_COST_PER_MILE = 0.25;

export type LeaseEndOption = 'return' | 'buy-out' | 'roll-to-new';

export type LeaseEndOptionsResult = {
  returnCost: number;
  buyOutCost: number;
  rollToNewCost: number;
  cheapest: LeaseEndOption;
};

export function computeLeaseEndOptions({
  projectedOverageMiles,
  overageCostPerMile,
  buyOutAmount,
  newMonthlyPayment,
  newLeaseTerm,
}: {
  projectedOverageMiles: number;
  overageCostPerMile: number;
  buyOutAmount: number;
  newMonthlyPayment: number;
  newLeaseTerm: number;
}): LeaseEndOptionsResult {
  const returnCost = Math.max(0, projectedOverageMiles) * overageCostPerMile;
  const buyOutCost = Math.max(0, buyOutAmount);
  const rollToNewCost = Math.max(0, newMonthlyPayment) * Math.max(0, newLeaseTerm);

  const costs: Array<[LeaseEndOption, number]> = [
    ['return', returnCost],
    ['buy-out', buyOutCost],
    ['roll-to-new', rollToNewCost],
  ];

  let cheapest: LeaseEndOption = 'return';
  let minCost = returnCost;
  for (const [option, cost] of costs) {
    if (cost < minCost) {
      minCost = cost;
      cheapest = option;
    }
  }

  return { returnCost, buyOutCost, rollToNewCost, cheapest };
}

export function LeaseEndOptionsScreen(): React.ReactElement {
  const theme = useTheme();
  const navigation = useNavigation<HomeStackNavigationProp>();
  const route = useRoute<LeaseEndOptionsRouteProp>();
  const { leaseId } = route.params;

  const [buyOutInput, setBuyOutInput] = useState('');
  const [monthlyInput, setMonthlyInput] = useState('');
  const [termInput, setTermInput] = useState('');

  const {
    data: lease,
    isLoading: leaseLoading,
    error: leaseError,
  } = useQuery({
    queryKey: ['lease', leaseId],
    queryFn: () => getLease(leaseId),
  });

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['lease-summary', leaseId],
    queryFn: () => getLeaseSummary(leaseId),
  });

  const { data: subscription } = useQuery({
    queryKey: ['subscription-status'],
    queryFn: getStatus,
  });

  const isPremium = subscription?.isPremium ?? false;
  const isLoading = leaseLoading || summaryLoading;

  const handleUpgrade = () => {
    const parent = navigation.getParent();
    if (parent != null) {
      (parent.navigate as unknown as (screen: string, params: object) => void)('Settings', {
        screen: 'Subscription',
      });
    }
  };

  if (isLoading) {
    return (
      <View
        style={[styles.center, { backgroundColor: theme.colors.background }]}
        testID="lease-end-options-screen"
      >
        <ActivityIndicator
          size="large"
          color={theme.colors.primary}
          testID="lease-end-options-loading"
        />
      </View>
    );
  }

  if (leaseError != null) {
    return (
      <View
        style={[styles.center, { backgroundColor: theme.colors.background }]}
        testID="lease-end-options-screen"
      >
        <ErrorMessage
          message="Failed to load lease data"
          onRetry={() => navigation.goBack()}
        />
      </View>
    );
  }

  const projectedOverage =
    summary != null ? Math.max(0, summary.projectedMiles - summary.totalMiles) : 0;

  const buyOutAmount = parseFloat(buyOutInput) || 0;
  const newMonthlyPayment = parseFloat(monthlyInput) || 0;
  const newLeaseTerm = parseInt(termInput, 10) || 0;

  const allInputsProvided = buyOutAmount > 0 && newMonthlyPayment > 0 && newLeaseTerm > 0;

  const result = computeLeaseEndOptions({
    projectedOverageMiles: projectedOverage,
    overageCostPerMile: DEFAULT_OVERAGE_COST_PER_MILE,
    buyOutAmount,
    newMonthlyPayment,
    newLeaseTerm,
  });

  const vehicleLabel =
    lease != null
      ? `${lease.vehicleYear} ${lease.vehicleMake} ${lease.vehicleModel}${lease.vehicleTrim != null ? ` ${lease.vehicleTrim}` : ''}`
      : '';

  const cheapest = allInputsProvided ? result.cheapest : null;

  const cardBorderColor = (option: LeaseEndOption) =>
    cheapest === option ? theme.colors.success : theme.colors.border;

  return (
    <PremiumGate isPremium={isPremium} onUpgrade={handleUpgrade}>
      <SafeAreaView
        style={[styles.flex, { backgroundColor: theme.colors.background }]}
        testID="lease-end-options-screen"
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            testID="lease-end-options-back"
          >
            <Text style={[styles.backButton, { color: theme.colors.primary }]}>{'← Back'}</Text>
          </TouchableOpacity>
          <Text
            style={[styles.headerTitle, { color: theme.colors.textPrimary }]}
            testID="lease-end-options-title"
          >
            {'Lease End Options'}
          </Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          testID="lease-end-options-scroll"
        >
          {/* Vehicle info */}
          {vehicleLabel.length > 0 && (
            <View
              style={[
                styles.section,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
              ]}
              testID="lease-end-vehicle-label"
            >
              <Text style={[styles.vehicleLabel, { color: theme.colors.textPrimary }]}>
                {vehicleLabel}
              </Text>
              <Text style={[styles.vehicleSub, { color: theme.colors.textSecondary }]}>
                {`Projected overage: ${projectedOverage > 0 ? `+${projectedOverage.toLocaleString()} mi` : 'None'}`}
              </Text>
            </View>
          )}

          {/* Inputs section */}
          <View
            style={[
              styles.section,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
            ]}
            testID="lease-end-inputs-section"
          >
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
              {'Estimate Inputs'}
            </Text>
            <Text style={[styles.sectionSubtitle, { color: theme.colors.textSecondary }]}>
              {'Enter values to compare all three options.'}
            </Text>

            {/* Buyout amount */}
            <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>
              {'Buyout / Residual Amount'}
            </Text>
            <View
              style={[styles.inputRow, { borderColor: theme.colors.border }]}
              testID="lease-end-buyout-input-row"
            >
              <Text style={[styles.currencySymbol, { color: theme.colors.textSecondary }]}>
                {'$'}
              </Text>
              <TextInput
                style={[styles.textInput, { color: theme.colors.textPrimary }]}
                value={buyOutInput}
                onChangeText={setBuyOutInput}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={theme.colors.textSecondary}
                testID="lease-end-buyout-input"
                accessibilityLabel="Buyout or residual amount"
              />
            </View>

            {/* New monthly payment */}
            <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>
              {'New Lease Monthly Payment'}
            </Text>
            <View
              style={[styles.inputRow, { borderColor: theme.colors.border }]}
              testID="lease-end-monthly-input-row"
            >
              <Text style={[styles.currencySymbol, { color: theme.colors.textSecondary }]}>
                {'$'}
              </Text>
              <TextInput
                style={[styles.textInput, { color: theme.colors.textPrimary }]}
                value={monthlyInput}
                onChangeText={setMonthlyInput}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={theme.colors.textSecondary}
                testID="lease-end-monthly-input"
                accessibilityLabel="New lease monthly payment"
              />
            </View>

            {/* New lease term */}
            <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>
              {'New Lease Term (months)'}
            </Text>
            <View
              style={[styles.inputRow, { borderColor: theme.colors.border }]}
              testID="lease-end-term-input-row"
            >
              <TextInput
                style={[styles.textInput, { color: theme.colors.textPrimary }]}
                value={termInput}
                onChangeText={setTermInput}
                keyboardType="number-pad"
                placeholder="36"
                placeholderTextColor={theme.colors.textSecondary}
                testID="lease-end-term-input"
                accessibilityLabel="New lease term in months"
              />
              <Text style={[styles.unitLabel, { color: theme.colors.textSecondary }]}>
                {'mo'}
              </Text>
            </View>
          </View>

          {/* Three-column comparison */}
          <View
            style={[
              styles.section,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
            ]}
            testID="lease-end-comparison-section"
          >
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
              {'Cost Comparison'}
            </Text>

            <View style={styles.comparisonRow} testID="lease-end-comparison-row">
              {/* Return card */}
              <View
                style={[
                  styles.comparisonCard,
                  {
                    backgroundColor: theme.colors.background,
                    borderColor: cardBorderColor('return'),
                  },
                ]}
                testID="lease-end-return-card"
              >
                {cheapest === 'return' && (
                  <View
                    style={[styles.recommendedBadge, { backgroundColor: theme.colors.success }]}
                    testID="lease-end-return-recommended"
                  >
                    <Text style={[styles.recommendedText, { color: theme.colors.surface }]}>
                      {'Best'}
                    </Text>
                  </View>
                )}
                <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>
                  {'Return'}
                </Text>
                <Text
                  style={[styles.cardCost, { color: theme.colors.textPrimary }]}
                  testID="lease-end-return-cost"
                >
                  {`$${result.returnCost.toFixed(2)}`}
                </Text>
                <Text style={[styles.cardDetail, { color: theme.colors.textSecondary }]}>
                  {projectedOverage > 0
                    ? `${projectedOverage.toLocaleString()} mi × $${DEFAULT_OVERAGE_COST_PER_MILE.toFixed(2)}/mi`
                    : 'No overage fees'}
                </Text>
              </View>

              {/* Buy Out card */}
              <View
                style={[
                  styles.comparisonCard,
                  {
                    backgroundColor: theme.colors.background,
                    borderColor: cardBorderColor('buy-out'),
                  },
                ]}
                testID="lease-end-buyout-card"
              >
                {cheapest === 'buy-out' && (
                  <View
                    style={[styles.recommendedBadge, { backgroundColor: theme.colors.success }]}
                    testID="lease-end-buyout-recommended"
                  >
                    <Text style={[styles.recommendedText, { color: theme.colors.surface }]}>
                      {'Best'}
                    </Text>
                  </View>
                )}
                <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>
                  {'Buy Out'}
                </Text>
                <Text
                  style={[styles.cardCost, { color: theme.colors.textPrimary }]}
                  testID="lease-end-buyout-cost"
                >
                  {buyOutAmount > 0 ? `$${result.buyOutCost.toFixed(2)}` : '—'}
                </Text>
                <Text style={[styles.cardDetail, { color: theme.colors.textSecondary }]}>
                  {buyOutAmount > 0 ? 'Residual / buyout price' : 'Enter amount above'}
                </Text>
              </View>

              {/* Roll to New card */}
              <View
                style={[
                  styles.comparisonCard,
                  {
                    backgroundColor: theme.colors.background,
                    borderColor: cardBorderColor('roll-to-new'),
                  },
                ]}
                testID="lease-end-roll-card"
              >
                {cheapest === 'roll-to-new' && (
                  <View
                    style={[styles.recommendedBadge, { backgroundColor: theme.colors.success }]}
                    testID="lease-end-roll-recommended"
                  >
                    <Text style={[styles.recommendedText, { color: theme.colors.surface }]}>
                      {'Best'}
                    </Text>
                  </View>
                )}
                <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>
                  {'Roll to New'}
                </Text>
                <Text
                  style={[styles.cardCost, { color: theme.colors.textPrimary }]}
                  testID="lease-end-roll-cost"
                >
                  {newMonthlyPayment > 0 && newLeaseTerm > 0
                    ? `$${result.rollToNewCost.toFixed(2)}`
                    : '—'}
                </Text>
                <Text style={[styles.cardDetail, { color: theme.colors.textSecondary }]}>
                  {newMonthlyPayment > 0 && newLeaseTerm > 0
                    ? `$${newMonthlyPayment.toFixed(2)}/mo × ${newLeaseTerm} mo`
                    : 'Enter values above'}
                </Text>
              </View>
            </View>
          </View>

          {/* Recommendation section */}
          {allInputsProvided && (
            <View
              style={[
                styles.section,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
              ]}
              testID="lease-end-recommendation-section"
            >
              <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                {'Recommendation'}
              </Text>
              <Text
                style={[styles.recommendationText, { color: theme.colors.success }]}
                testID="lease-end-recommendation-text"
              >
                {cheapest === 'return'
                  ? 'Returning the vehicle is your lowest-cost option.'
                  : cheapest === 'buy-out'
                  ? 'Buying out the vehicle is your lowest-cost option.'
                  : 'Rolling to a new lease is your lowest-cost option.'}
              </Text>
              <Text style={[styles.disclaimer, { color: theme.colors.textSecondary }]}>
                {'Estimates only. Actual costs depend on final inspection, taxes, and fees.'}
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </PremiumGate>
  );
}

const styles = StyleSheet.create({
  backButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  cardCost: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
    marginTop: 6,
  },
  cardDetail: {
    fontSize: 10,
    lineHeight: 14,
    textAlign: 'center',
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  center: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  comparisonCard: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 2,
    flex: 1,
    marginHorizontal: 3,
    padding: 10,
  },
  comparisonRow: {
    flexDirection: 'row',
    marginTop: 12,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '600',
    paddingRight: 4,
  },
  disclaimer: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 8,
  },
  flex: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerRight: {
    width: 50,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  inputLabel: {
    fontSize: 13,
    marginBottom: 6,
    marginTop: 14,
  },
  inputRow: {
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  recommendationText: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 21,
    marginTop: 4,
  },
  recommendedBadge: {
    borderRadius: 6,
    marginBottom: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  recommendedText: {
    fontSize: 9,
    fontWeight: '700',
  },
  scrollContent: {
    paddingBottom: 96,
    paddingTop: 8,
  },
  section: {
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
  },
  sectionSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  textInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    padding: 0,
    textAlign: 'center',
  },
  unitLabel: {
    fontSize: 18,
    fontWeight: '600',
    paddingLeft: 4,
  },
  vehicleLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  vehicleSub: {
    fontSize: 13,
    marginTop: 2,
  },
});
