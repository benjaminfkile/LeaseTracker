import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteLease, getLeases } from '../../api/leaseApi';
import { EmptyState } from '../../components/EmptyState';
import { ErrorMessage } from '../../components/ErrorMessage';
import { LeaseCard } from '../../components/LeaseCard';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useTheme } from '../../theme';
import type { LeaseStackNavigationProp } from '../../navigation/types';
import type { Lease } from '../../types/api';

export function LeaseListScreen(): React.ReactElement {
  const theme = useTheme();
  const navigation = useNavigation<LeaseStackNavigationProp>();
  const queryClient = useQueryClient();

  const {
    data: leases,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['leases'],
    queryFn: getLeases,
  });

  const { mutate: archiveLease } = useMutation({
    mutationFn: (id: string) => deleteLease(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['leases'] });
    },
  });

  const addButton = (
    <TouchableOpacity
      onPress={() => navigation.navigate('AddLease')}
      accessibilityRole="button"
      accessibilityLabel="Add lease"
      testID="lease-list-add-button"
    >
      <Text style={[styles.addButtonText, { color: theme.colors.primary }]}>
        +
      </Text>
    </TouchableOpacity>
  );

  const renderItem = ({ item }: { item: Lease }) => (
    <LeaseCard
      lease={item}
      onArchive={id => archiveLease(id)}
      onPress={id => navigation.navigate('EditLease', { leaseId: id })}
    />
  );

  return (
    <SafeAreaView
      style={[styles.flex, { backgroundColor: theme.colors.background }]}
      testID="lease-list-screen"
    >
      <ScreenHeader
        title="My Leases"
        rightAction={addButton}
      />

      {isLoading && (
        <View style={styles.center}>
          <ActivityIndicator
            size="large"
            color={theme.colors.primary}
            testID="lease-list-loading"
          />
        </View>
      )}

      {!isLoading && error != null && (
        <View style={styles.center}>
          <ErrorMessage
            message="Failed to load leases"
            onRetry={refetch}
          />
        </View>
      )}

      {!isLoading && error == null && (
        <FlatList
          data={leases ?? []}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          testID="lease-list-flat-list"
          contentContainerStyle={
            leases == null || leases.length === 0
              ? styles.emptyContainer
              : styles.listContent
          }
          ListEmptyComponent={
            <EmptyState
              title="No leases yet. Add your first lease →"
              ctaLabel="Add Lease"
              onCtaPress={() => navigation.navigate('AddLease')}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  addButtonText: {
    fontSize: 28,
    fontWeight: '400',
    lineHeight: 32,
  },
  center: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  emptyContainer: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 24,
  },
});
