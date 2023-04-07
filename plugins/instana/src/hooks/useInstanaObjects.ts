/*
 * Copyright 2023 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { useEffect, useState } from 'react';
import { useApi } from '@backstage/core-plugin-api';
import { instanaApiRef } from '../api/types';

export const useInstanaObjects = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<boolean>(false);

  const instanaApi = useApi(instanaApiRef);
  const getObjects = async () => {
    try {
      const health = await instanaApi.getHealth();
      setStatus(health.status);
    } catch (e) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    getObjects();
  });
  return {
    error,
    loading,
    status,
  };
};
