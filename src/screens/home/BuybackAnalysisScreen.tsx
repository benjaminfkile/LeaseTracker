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

type BuybackAnalysisRouteProp = RouteProp<HomeStackParamList, 'BuybackAnalysis'>;

const DEFAULT_OVERAGE_COST_PER_MILE = 0.25;

export type BuybackAnalysisResult = {
  buyNowCost: number;
  payAtTurnInCost: number;
  savings: number;
  recommendation: 'buy-now' | 'pay-at-turn-in' | 'no-action';
};

export function computeBuybackAnalysis({
  projectedOverageMiles,
  buybackRatePerMile,
  overageCostPerMile,
}: {
  projectedOverageMiles: number;
  buybackRatePerMile: number;
  overageCostPerMile: number;
}): BuybackAnalysisResult {
  if (projectedOverageMiles <= 0) {
    return { buyNowCost: 0, payAtTurnInCost: 0, savings: 0, recommendation: 'no-action' };
  }
  const payAtTurnInCost = projectedOverageMiles * overageCostPerMile;
  if (buybackRatePerMile <= 0) {
    return { buyNowCost: 0, payAtTurnInCost, savings: 0, recommendation: 'no-action' };
  }
  const buyNowCost = projectedOverageMiles * buybackRatePerMile;
  const savings = Math.abs(buyNowCost - payAtTurnInCost);
  const recommendation = buyNowCost <= payAtTurnInCost ? 'buy-now' : 'pay-at-turn-in';
  return { buyNowCost, payAtTurnInCost, savings, recommendation };
}

export function BuybackAnalysisScreen(): React.ReactElement {
  const theme = useTheme();
  const navigation = useNavigation<HomeStackNavigationProp>();
  const route = useRoute<BuybackAnalysisRouteProp>();
  const { leaseId } = route.params;

  const [buybackRateInput, setBuybackRateInput] = useState('');

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
        testID="buyback-analysis-screen"
      >
        <ActivityIndicator
          size="large"
          color={theme.colors.primary}
          testID="buyback-analysis-loading"
        />
      </View>
    );
  }

  if (leaseError != null) {
    return (
      <View
        style={[styles.center, { backgroundColor: theme.colors.background }]}
        testID="buyback-analysis-screen"
      >
        <ErrorMessage
          message="Failed to load lease data"
          onRetry={() => navigation.goBack()}
        />
      </View>
    );
  }

  const projectedOverage = summary != null
    ? Math.max(0, summary.projectedMiles - summary.totalMiles)
    : 0;

  const buybackRate = parseFloat(buybackRateInput) || 0;
  const analysis = computeBuybackAnalysis({
    projectedOverageMiles: projectedOverage,
    buybackRatePerMile: buybackRate,
    overageCostPerMile: DEFAULT_OVERAGE_COST_PER_MILE,
  });

  const vehicleLabel = lease != null
    ? `${lease.vehicleYear} ${lease.vehicleMake} ${lease.vehicleModel}${lease.vehicleTrim != null ? ` ${lease.vehicleTrim}` : ''}`
    : '';

  return (
    <PremiumGate isPremium={isPremium} onUpgrade={handleUpgrade}>
      <SafeAreaView
        style={[styles.flex, { backgroundColor: theme.colors.background }]}
        testID="buyback-analysis-screen"
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            testID="buyback-analysis-back"
          >
            <Text style={[styles.backButton, { color: theme.colors.primary }]}>{'← Back'}</Text>
          </TouchableOpacity>
          <Text
            style={[styles.headerTitle, { color: theme.colors.textPrimary }]}
            testID="buyback-analysis-title"
          >
            {'Buyback Analysis'}
          </Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          testID="buyback-analysis-scroll"
        >
          {/* Vehicle info */}
          {vehicleLabel.length > 0 && (
            <View
              style={[
                styles.section,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
              ]}
              testID="buyback-vehicle-label"
            >
              <Text style={[styles.vehicleLabel, { color: theme.colors.textPrimary }]}>
                {vehicleLabel}
              </Text>
              <Text style={[styles.vehicleSub, { color: theme.colors.textSecondary }]}>
                {`Projected overage: ${projectedOverage > 0 ? `+${projectedOverage.toLocaleString()} mi` : 'None'}`}
              </Text>
            </View>
          )}

          {/* Dealer buy-back rate input */}
          <View
            style={[
              styles.section,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
            ]}
            testID="buyback-rate-section"
          >
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
              {"Dealer's Buy-Back Rate"}
            </Text>
            <Text style={[styles.sectionSubtitle, { color: theme.colors.textSecondary }]}>
              {'Enter the rate per mile quoted by your dealer to pre-purchase miles.'}
            </Text>
            <View
              style={[styles.rateInputRow, { borderColor: theme.colors.border }]}
              testID="buyback-rate-input-row"
            >
              <Text style={[styles.currencySymbol, { color: theme.colors.textSecondary }]}>
                {'$'}
              </Text>
              <TextInput
                style={[styles.rateInput, { color: theme.colors.textPrimary }]}
                value={buybackRateInput}
                onChangeText={setBuybackRateInput}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={theme.colors.textSecondary}
                testID="buyback-rate-input"
                accessibilityLabel="Dealer buy-back rate per mile"
              />
              <Text style={[styles.perMileLabel, { color: theme.colors.textSecondary }]}>
                {'/mi'}
              </Text>
            </View>
          </View>

          {/* Cost comparison */}
          <View
            style={[
              styles.section,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
            ]}
            testID="buyback-comparison-section"
          >
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
              {'Cost Comparison'}
            </Text>

            {projectedOverage <= 0 ? (
              <Text
                style={[styles.onPaceText, { color: theme.colors.success }]}
                testID="buyback-on-pace-message"
              >
                {'You are on pace — no overage expected. Nothing to buy back.'}
              </Text>
            ) : (
              <View style={styles.comparisonRow} testID="buyback-comparison-row">
                {/* Buy Miles Now card */}
                <View
                  style={[
                    styles.comparisonCard,
                    {
                      backgroundColor: theme.colors.background,
                      borderColor:
                        analysis.recommendation === 'buy-now'
                          ? theme.colors.success
                          : theme.colors.border,
                    },
                  ]}
                  testID="buyback-buy-now-card"
                >
                  {analysis.recommendation === 'buy-now' && (
                    <View
                      style={[styles.recommendedBadge, { backgroundColor: theme.colors.success }]}
                      testID="buyback-buy-now-recommended"
                    >
                      <Text style={[styles.recommendedText, { color: theme.colors.surface }]}>
                        {'Recommended'}
                      </Text>
                    </View>
                  )}
                  <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>
                    {'Buy Miles Now'}
                  </Text>
                  <Text
                    style={[styles.cardCost, { color: theme.colors.textPrimary }]}
                    testID="buyback-buy-now-cost"
                  >
                    {buybackRate > 0 ? `$${analysis.buyNowCost.toFixed(2)}` : '—'}
                  </Text>
                  <Text style={[styles.cardDetail, { color: theme.colors.textSecondary }]}>
                    {buybackRate > 0
                      ? `${projectedOverage.toLocaleString()} mi × $${buybackRate.toFixed(2)}/mi`
                      : 'Enter a rate above'}
                  </Text>
                </View>

                {/* Pay at Turn-In card */}
                <View
                  style={[
                    styles.comparisonCard,
                    {
                      backgroundColor: theme.colors.background,
                      borderColor:
                        analysis.recommendation === 'pay-at-turn-in'
                          ? theme.colors.success
                          : theme.colors.border,
                    },
                  ]}
                  testID="buyback-turn-in-card"
                >
                  {analysis.recommendation === 'pay-at-turn-in' && (
                    <View
                      style={[styles.recommendedBadge, { backgroundColor: theme.colors.success }]}
                      testID="buyback-turn-in-recommended"
                    >
                      <Text style={[styles.recommendedText, { color: theme.colors.surface }]}>
                        {'Recommended'}
                      </Text>
                    </View>
                  )}
                  <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>
                    {'Pay at Turn-In'}
                  </Text>
                  <Text
                    style={[styles.cardCost, { color: theme.colors.textPrimary }]}
                    testID="buyback-turn-in-cost"
                  >
                    {`$${analysis.payAtTurnInCost.toFixed(2)}`}
                  </Text>
                  <Text style={[styles.cardDetail, { color: theme.colors.textSecondary }]}>
                    {`${projectedOverage.toLocaleString()} mi × $${DEFAULT_OVERAGE_COST_PER_MILE.toFixed(2)}/mi`}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Savings summary */}
          {projectedOverage > 0 && buybackRate > 0 && analysis.recommendation !== 'no-action' && (
            <View
              style={[
                styles.section,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
              ]}
              testID="buyback-savings-section"
            >
              <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                {'Recommendation'}
              </Text>
              <Text
                style={[styles.savingsText, { color: theme.colors.success }]}
                testID="buyback-savings-text"
              >
                {analysis.recommendation === 'buy-now'
                  ? `Buy miles now to save ~$${analysis.savings.toFixed(2)} vs paying at turn-in.`
                  : `Pay at turn-in to save ~$${analysis.savings.toFixed(2)} vs buying miles now.`}
              </Text>
              <Text style={[styles.disclaimer, { color: theme.colors.textSecondary }]}>
                {'Estimate based on projected overage at current pace. Actual results may vary.'}
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
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
    marginTop: 8,
  },
  cardDetail: {
    fontSize: 11,
    lineHeight: 15,
    textAlign: 'center',
  },
  cardTitle: {
    fontSize: 13,
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
    marginHorizontal: 4,
    padding: 12,
  },
  comparisonRow: {
    flexDirection: 'row',
    marginTop: 4,
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
  onPaceText: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  perMileLabel: {
    fontSize: 18,
    fontWeight: '600',
    paddingLeft: 4,
  },
  rateInput: {
    flex: 1,
    fontSize: 22,
    fontWeight: '600',
    padding: 0,
    textAlign: 'center',
  },
  rateInputRow: {
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  recommendedBadge: {
    borderRadius: 6,
    marginBottom: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  recommendedText: {
    fontSize: 10,
    fontWeight: '700',
  },
  savingsText: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 21,
    marginTop: 4,
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
  vehicleLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  vehicleSub: {
    fontSize: 13,
    marginTop: 2,
  },
});
