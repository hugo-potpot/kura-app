import { useState, useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { useQueryClient } from '@tanstack/react-query';
import { generateId } from '@kura/shared';
import { transmissions } from '@kura/db';
import { syncTransmissions } from '../services/syncTransmissions';

import { getDb } from '@/lib/db';
import { useAuthStore } from '@/features/auth/stores/auth-store';
import {
  type CareType,
  formatTemplateFields,
} from '../services/care-type-templates';

export type SaveStatus = 'idle' | 'saving' | 'done' | 'error';

export interface UseTextTransmissionResult {
  saveStatus: SaveStatus;
  save: (patientId: string, careType: CareType, values: Record<string, string>) => Promise<string | null>;
  reset: () => void;
}

export function useTextTransmission(): UseTextTransmissionResult {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const queryClient = useQueryClient();

  const save = useCallback(
    async (
      patientId: string,
      careType: CareType,
      values: Record<string, string>,
    ): Promise<string | null> => {
      if (userId === null) return null;

      const contentValidated = formatTemplateFields(careType, values);
      if (contentValidated.trim().length === 0) return null;

      setSaveStatus('saving');
      try {
        const db = await getDb();
        const now = new Date();
        const id = generateId();

        await db.insert(transmissions).values({
          id,
          patientId,
          authorId: userId,
          contentOriginal: null,
          contentValidated,
          careType,
          createdAt: now,
          updatedAt: now,
          syncedAt: null,
        });

        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        void queryClient.invalidateQueries({ queryKey: ['transmissions'] });
        // Tenter une sync immédiate si online
        void syncTransmissions().then(() => {
          void queryClient.invalidateQueries({ queryKey: ['transmissions'] });
        });
        setSaveStatus('done');
        return id;
      } catch {
        setSaveStatus('error');
        return null;
      }
    },
    [userId],
  );

  const reset = useCallback(() => setSaveStatus('idle'), []);

  return { saveStatus, save, reset };
}
