import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm, useController } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { ScreenHeader } from '../../components/ScreenHeader';
import { palette, useTheme } from '../../theme';
import {
  getLeaseMembers,
  inviteLeaseMember,
  removeLeaseMember,
} from '../../api/leaseApi';
import type { LeaseMember, InviteMemberInput } from '../../types/api';
import type { LeaseStackNavigationProp, LeaseStackParamList } from '../../navigation/types';

const inviteSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
});

type InviteFormData = z.infer<typeof inviteSchema>;

type RoleOption = 'editor' | 'viewer';

function getMemberDisplayName(member: LeaseMember): string {
  if (member.display_name) {
    return member.display_name;
  }
  return member.email;
}

function getRoleBadgeColor(role: LeaseMember['role'], colors: { primary: string; success: string; warning: string }): string {
  switch (role) {
    case 'owner':
      return colors.primary;
    case 'editor':
      return colors.success;
    case 'viewer':
      return colors.warning;
  }
}

type MemberRowProps = {
  member: LeaseMember;
  isOwner: boolean;
  onRemove: (memberId: string) => void;
};

function MemberRow({ member, isOwner, onRemove }: MemberRowProps): React.ReactElement {
  const theme = useTheme();

  const handleRemovePress = () => {
    Alert.alert(
      'Remove Member',
      `Remove ${getMemberDisplayName(member)} from this lease?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => onRemove(member.id),
        },
      ],
    );
  };

  return (
    <View
      style={[
        styles.memberRow,
        { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border },
      ]}
      testID={`member-row-${member.id}`}
    >
      <View style={styles.memberInfo}>
        <View style={styles.memberNameRow}>
          <Text
            style={[styles.memberName, { color: theme.colors.textPrimary }]}
            numberOfLines={1}
          >
            {getMemberDisplayName(member)}
          </Text>
          <View
            style={[
              styles.roleBadge,
              { backgroundColor: getRoleBadgeColor(member.role, theme.colors) },
            ]}
          >
            <Text style={styles.roleBadgeText}>
              {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
            </Text>
          </View>
        </View>
        {member.display_name != null && (
          <Text
            style={[styles.memberEmail, { color: theme.colors.textSecondary }]}
            numberOfLines={1}
          >
            {member.email}
          </Text>
        )}
      </View>
      {isOwner && member.role !== 'owner' && (
        <TouchableOpacity
          onPress={handleRemovePress}
          style={styles.removeButton}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${getMemberDisplayName(member)}`}
          testID={`remove-member-${member.id}`}
        >
          <Text style={[styles.removeButtonText, { color: theme.colors.error }]}>Remove</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export function ShareLeaseScreen(): React.ReactElement {
  const theme = useTheme();
  const navigation = useNavigation<LeaseStackNavigationProp>();
  const route = useRoute<RouteProp<LeaseStackParamList, 'ShareLease'>>();
  const { leaseId } = route.params;
  const queryClient = useQueryClient();

  const [selectedRole, setSelectedRole] = useState<RoleOption>('viewer');

  const {
    data: members,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['lease-members', leaseId],
    queryFn: () => getLeaseMembers(leaseId),
  });

  const { mutate: invite, isPending: isInviting } = useMutation({
    mutationFn: (data: InviteMemberInput) => inviteLeaseMember(leaseId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['lease-members', leaseId] });
      resetForm();
      Alert.alert('Invite Sent', 'An invite link has been sent to the email address.');
    },
    onError: (err: Error) => {
      Alert.alert('Error', err.message ?? 'Failed to send invite. Please try again.');
    },
  });

  const { mutate: remove } = useMutation({
    mutationFn: (memberId: string) => removeLeaseMember(leaseId, memberId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['lease-members', leaseId] });
    },
    onError: (err: Error) => {
      Alert.alert('Error', err.message ?? 'Failed to remove member.');
    },
  });

  const {
    control,
    handleSubmit,
    reset: resetForm,
    formState: { errors },
  } = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: '' },
  });

  const { field: emailField } = useController({ control, name: 'email' });

  const onSubmit = (data: InviteFormData) => {
    invite({ email: data.email.trim().toLowerCase(), role: selectedRole });
  };

  const currentUserIsOwner = members?.some(m => m.role === 'owner') ?? false;
  const nonOwnerMembers = members?.filter(m => m.role !== 'owner') ?? [];

  return (
    <SafeAreaView
      style={[styles.flex, { backgroundColor: theme.colors.background }]}
      edges={['top', 'left', 'right']}
      testID="share-lease-screen"
    >
      <ScreenHeader title="Share Lease" onBackPress={() => navigation.goBack()} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          data={members ?? []}
          keyExtractor={item => item.id}
          testID="members-list"
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View style={styles.headerSection}>
              <Text
                style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}
                testID="invite-section-label"
              >
                Invite a Driver
              </Text>

              <Input
                label="Email Address"
                value={emailField.value}
                onChangeText={emailField.onChange}
                placeholder="name@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                errorMessage={errors.email?.message}
                testID="invite-email-input"
              />

              <Text
                style={[styles.roleLabel, { color: theme.colors.textPrimary }]}
                testID="role-label"
              >
                Role
              </Text>
              <View
                style={[
                  styles.roleToggle,
                  { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                ]}
                testID="role-toggle"
              >
                <TouchableOpacity
                  style={[
                    styles.roleOption,
                    selectedRole === 'editor' && { backgroundColor: theme.colors.primary },
                  ]}
                  onPress={() => setSelectedRole('editor')}
                  testID="role-option-editor"
                  accessibilityRole="button"
                >
                  <Text
                    style={[
                      styles.roleOptionText,
                      {
                        color: selectedRole === 'editor'
                          ? theme.colors.surface
                          : theme.colors.textSecondary,
                      },
                    ]}
                  >
                    Editor
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.roleOption,
                    selectedRole === 'viewer' && { backgroundColor: theme.colors.primary },
                  ]}
                  onPress={() => setSelectedRole('viewer')}
                  testID="role-option-viewer"
                  accessibilityRole="button"
                >
                  <Text
                    style={[
                      styles.roleOptionText,
                      {
                        color: selectedRole === 'viewer'
                          ? theme.colors.surface
                          : theme.colors.textSecondary,
                      },
                    ]}
                  >
                    Viewer
                  </Text>
                </TouchableOpacity>
              </View>

              <Text
                style={[styles.roleHint, { color: theme.colors.textSecondary }]}
                testID="role-hint"
              >
                {selectedRole === 'editor'
                  ? 'Editors can log odometer readings and manage trips.'
                  : 'Viewers can see lease data but cannot make changes.'}
              </Text>

              <View style={styles.inviteButtonWrapper}>
                <Button
                  title="Send Invite"
                  onPress={handleSubmit(onSubmit)}
                  isLoading={isInviting}
                  testID="send-invite-button"
                />
              </View>

              {(members ?? []).length > 0 && (
                <Text
                  style={[styles.sectionLabel, styles.membersLabel, { color: theme.colors.textSecondary }]}
                  testID="members-section-label"
                >
                  {`Members (${members?.length ?? 0})`}
                </Text>
              )}
            </View>
          }
          renderItem={({ item }) => (
            <MemberRow
              member={item}
              isOwner={currentUserIsOwner}
              onRemove={id => remove(id)}
            />
          )}
          ListEmptyComponent={
            isLoading ? (
              <ActivityIndicator
                style={styles.loader}
                size="large"
                color={theme.colors.primary}
                testID="members-loading"
              />
            ) : error != null ? (
              <View style={styles.errorContainer}>
                <Text style={[styles.errorText, { color: theme.colors.error }]}>
                  Failed to load members.
                </Text>
                <TouchableOpacity onPress={() => void refetch()} testID="members-retry">
                  <Text style={[styles.retryText, { color: theme.colors.primary }]}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.emptyContainer} testID="members-empty">
                <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                  No one else has access to this lease yet.
                </Text>
              </View>
            )
          }
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  errorContainer: {
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 14,
    marginBottom: 8,
  },
  flex: {
    flex: 1,
  },
  headerSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  inviteButtonWrapper: {
    marginTop: 16,
  },
  listContent: {
    paddingBottom: 24,
  },
  loader: {
    marginTop: 24,
  },
  memberEmail: {
    fontSize: 12,
    marginTop: 2,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
  },
  memberNameRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  memberRow: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  membersLabel: {
    marginTop: 28,
  },
  removeButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  removeButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  roleBadge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  roleBadgeText: {
    color: palette.white,
    fontSize: 11,
    fontWeight: '600',
  },
  roleHint: {
    fontSize: 12,
    marginTop: 8,
  },
  roleLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
    marginTop: 16,
  },
  roleOption: {
    alignItems: 'center',
    borderRadius: 6,
    flex: 1,
    paddingVertical: 8,
  },
  roleOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  roleToggle: {
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    padding: 4,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
});
