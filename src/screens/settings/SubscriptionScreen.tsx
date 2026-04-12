import React, { useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { getAvailablePurchases } from 'react-native-iap';
import { verifyApplePurchase, verifyGooglePurchase } from '../../api/subscriptionApi';
import { useTheme } from '../../theme';
import type { SettingsStackNavigationProp } from '../../navigation/types';

const TERMS_URL = 'https://leasetracker.app/terms';
const PRIVACY_URL = 'https://leasetracker.app/privacy';
const BILLING_URL = 'https://leasetracker.app/billing';

const PRODUCT_ID_MONTHLY = 'com.benkile.leasetracker.premium.monthly';
const PRODUCT_ID_YEARLY = 'com.benkile.leasetracker.premium.yearly';

type PricingPlan = 'monthly' | 'yearly';

const FEATURES = [
  'Unlimited leases',
  'Detailed charts & projections',
  'Buyback and lease-end analysis',
  'Lease sharing with family/co-drivers',
  'Ad-free experience',
];

export function SubscriptionScreen(): React.ReactElement {
  const theme = useTheme();
  const navigation = useNavigation<SettingsStackNavigationProp>();
  const queryClient = useQueryClient();

  const [selectedPlan, setSelectedPlan] = useState<PricingPlan>('yearly');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubscribe = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const productId =
        selectedPlan === 'monthly' ? PRODUCT_ID_MONTHLY : PRODUCT_ID_YEARLY;
      if (Platform.OS === 'ios') {
        // TODO: Obtain receiptData from StoreKit before calling verifyApplePurchase
        await verifyApplePurchase(productId);
      } else {
        // TODO: Obtain purchaseToken from Google Play Billing before calling verifyGooglePurchase
        await verifyGooglePurchase(productId, '');
      }
      await queryClient.invalidateQueries({ queryKey: ['subscription-status'] });
      navigation.goBack();
    } catch (error) {
      console.error('Purchase failed:', error);
      setErrorMessage('Purchase could not be completed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestorePurchases = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const purchases = await getAvailablePurchases();
      if (purchases.length === 0) {
        setErrorMessage('No previous purchases found.');
        return;
      }
      const latest = purchases.reduce((a, b) =>
        (b.transactionDate ?? 0) > (a.transactionDate ?? 0) ? b : a,
      );
      if (Platform.OS === 'ios') {
        await verifyApplePurchase(latest.transactionReceipt);
      } else {
        await verifyGooglePurchase(latest.productId, latest.purchaseToken ?? '');
      }
      await queryClient.invalidateQueries({ queryKey: ['subscription-status'] });
      navigation.goBack();
    } catch (error) {
      console.error('Restore purchases failed:', error);
      setErrorMessage('Could not restore purchases. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.flex, { backgroundColor: theme.colors.background }]}
      testID="subscription-screen"
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          testID="subscription-back"
        >
          <Text style={[styles.backButton, { color: theme.colors.primary }]}>{'← Back'}</Text>
        </TouchableOpacity>
        <Text
          style={[styles.headerTitle, { color: theme.colors.textPrimary }]}
          testID="subscription-title"
        >
          {'Go Premium'}
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        testID="subscription-scroll"
      >
        {/* Hero section */}
        <View style={styles.heroSection} testID="subscription-hero">
          <Text style={[styles.heroHeadline, { color: theme.colors.textPrimary }]}>
            {'Unlock the full LeaseTracker experience'}
          </Text>
          <Text style={[styles.heroSubtitle, { color: theme.colors.textSecondary }]}>
            {'Everything you need to master your lease, in one place.'}
          </Text>
        </View>

        {/* Feature list */}
        <View
          style={[
            styles.section,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
          ]}
          testID="subscription-features"
        >
          {FEATURES.map((feature) => (
            <View key={feature} style={styles.featureRow}>
              <Text style={[styles.featureCheck, { color: theme.colors.success }]}>{'✓'}</Text>
              <Text style={[styles.featureText, { color: theme.colors.textPrimary }]}>
                {feature}
              </Text>
            </View>
          ))}
        </View>

        {/* Pricing tiles */}
        <View style={styles.pricingRow} testID="subscription-pricing">
          {/* Monthly tile */}
          <TouchableOpacity
            style={[
              styles.pricingTile,
              {
                backgroundColor: theme.colors.surface,
                borderColor:
                  selectedPlan === 'monthly' ? theme.colors.primary : theme.colors.border,
              },
            ]}
            onPress={() => setSelectedPlan('monthly')}
            accessibilityRole="button"
            accessibilityLabel="Monthly plan"
            testID="subscription-plan-monthly"
          >
            <Text style={[styles.planTitle, { color: theme.colors.textPrimary }]}>{'Monthly'}</Text>
            <Text style={[styles.planPrice, { color: theme.colors.primary }]}>{'$4.99'}</Text>
            <Text style={[styles.planPeriod, { color: theme.colors.textSecondary }]}>
              {'per month'}
            </Text>
          </TouchableOpacity>

          {/* Yearly tile */}
          <TouchableOpacity
            style={[
              styles.pricingTile,
              {
                backgroundColor: theme.colors.surface,
                borderColor:
                  selectedPlan === 'yearly' ? theme.colors.primary : theme.colors.border,
              },
            ]}
            onPress={() => setSelectedPlan('yearly')}
            accessibilityRole="button"
            accessibilityLabel="Yearly plan"
            testID="subscription-plan-yearly"
          >
            <View
              style={[styles.bestValueChip, { backgroundColor: theme.colors.success }]}
              testID="subscription-best-value-chip"
            >
              <Text style={[styles.bestValueText, { color: theme.colors.surface }]}>
                {'Best Value'}
              </Text>
            </View>
            <Text style={[styles.planTitle, { color: theme.colors.textPrimary }]}>{'Yearly'}</Text>
            <Text style={[styles.planPrice, { color: theme.colors.primary }]}>{'$39.99'}</Text>
            <Text style={[styles.planPeriod, { color: theme.colors.textSecondary }]}>
              {'per year'}
            </Text>
            <Text style={[styles.planSavings, { color: theme.colors.success }]}>
              {'~$3.33/mo · Save 33%'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Error message */}
        {errorMessage != null && (
          <Text
            style={[styles.errorText, { color: theme.colors.error }]}
            testID="subscription-error"
          >
            {errorMessage}
          </Text>
        )}

        {/* Subscribe button */}
        <TouchableOpacity
          style={[
            styles.subscribeButton,
            { backgroundColor: theme.colors.primary },
            isLoading && styles.subscribeButtonDisabled,
          ]}
          onPress={() => {
            void handleSubscribe();
          }}
          disabled={isLoading}
          accessibilityRole="button"
          accessibilityLabel="Subscribe"
          testID="subscription-subscribe-button"
        >
          {isLoading ? (
            <ActivityIndicator
              color={theme.colors.surface}
              testID="subscription-loading"
            />
          ) : (
            <Text style={[styles.subscribeButtonText, { color: theme.colors.surface }]}>
              {'Subscribe'}
            </Text>
          )}
        </TouchableOpacity>

        {/* Restore purchases */}
        <TouchableOpacity
          onPress={() => {
            void handleRestorePurchases();
          }}
          disabled={isLoading}
          accessibilityRole="button"
          accessibilityLabel="Restore Purchases"
          testID="subscription-restore"
        >
          <Text style={[styles.restoreText, { color: theme.colors.primary }]}>
            {'Restore Purchases'}
          </Text>
        </TouchableOpacity>

        {/* Legal footer */}
        <View style={styles.legalFooter} testID="subscription-legal">
          <TouchableOpacity
            onPress={() => {
              void Linking.openURL(TERMS_URL);
            }}
            accessibilityRole="link"
            testID="subscription-terms"
          >
            <Text style={[styles.legalLink, { color: theme.colors.textSecondary }]}>
              {'Terms of Service'}
            </Text>
          </TouchableOpacity>
          <Text style={[styles.legalSeparator, { color: theme.colors.textSecondary }]}>{'|'}</Text>
          <TouchableOpacity
            onPress={() => {
              void Linking.openURL(PRIVACY_URL);
            }}
            accessibilityRole="link"
            testID="subscription-privacy"
          >
            <Text style={[styles.legalLink, { color: theme.colors.textSecondary }]}>
              {'Privacy Policy'}
            </Text>
          </TouchableOpacity>
          <Text style={[styles.legalSeparator, { color: theme.colors.textSecondary }]}>{'|'}</Text>
          <TouchableOpacity
            onPress={() => {
              void Linking.openURL(BILLING_URL);
            }}
            accessibilityRole="link"
            testID="subscription-billing"
          >
            <Text style={[styles.legalLink, { color: theme.colors.textSecondary }]}>
              {'Billing terms'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  backButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  bestValueChip: {
    borderRadius: 8,
    marginBottom: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  bestValueText: {
    fontSize: 10,
    fontWeight: '700',
  },
  errorText: {
    fontSize: 13,
    marginHorizontal: 16,
    marginTop: 8,
    textAlign: 'center',
  },
  featureCheck: {
    fontSize: 15,
    fontWeight: '700',
    marginRight: 10,
    width: 20,
  },
  featureRow: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingVertical: 6,
  },
  featureText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 21,
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
  heroHeadline: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 27,
    textAlign: 'center',
  },
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    textAlign: 'center',
  },
  legalFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    paddingBottom: 8,
    paddingHorizontal: 16,
  },
  legalLink: {
    fontSize: 12,
  },
  legalSeparator: {
    fontSize: 12,
    marginHorizontal: 6,
  },
  planPeriod: {
    fontSize: 12,
    marginTop: 2,
  },
  planPrice: {
    fontSize: 26,
    fontWeight: '700',
    marginTop: 6,
  },
  planSavings: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  planTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  pricingRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
  },
  pricingTile: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 2,
    flex: 1,
    marginHorizontal: 6,
    padding: 16,
  },
  restoreText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 14,
    textAlign: 'center',
  },
  scrollContent: {
    paddingBottom: 96,
  },
  section: {
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: 16,
    marginTop: 20,
    padding: 16,
  },
  subscribeButton: {
    alignItems: 'center',
    borderRadius: 14,
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 16,
  },
  subscribeButtonDisabled: {
    opacity: 0.6,
  },
  subscribeButtonText: {
    fontSize: 17,
    fontWeight: '700',
  },
});
