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
import { errorHandler } from '@backstage/backend-common';
import { Config } from '@backstage/config';
import express from 'express';
import Router from 'express-promise-router';
import { Logger } from 'winston';

export interface RouterOptions {
  logger: Logger;
  config: Config;
}

export async function createRouter(
  options: RouterOptions,
): Promise<express.Router> {
  const router = Router();
  router.use(express.json());

  router.get('/health', (_, response) => {
    response.json({ status: 'ok' });
  });

  router.get('/applications/:applicationId', async (req, res) => {
    const { applicationId } = req.params;
    const data = {
      applicationId: applicationId,
      windowSize: 84600000,
      data: {
        'calls.per_second': 5.831666666666667,
        'latency.mean': 5.171477565018577,
        'latency.p50': 0.0,
        'latency.p90': 0.0,
        'latency.p99': 38.0,
      },
    };
    res.json(data);
  });

  router.get('/websites/:websiteId', async (req, res) => {
    const { websiteId } = req.params;
    const data = {
      websiteId: websiteId,
      windowSize: 84600000,
      metrics: {
        'uniqueUsers.distinct_count': 949.0,
        'uniqueSessions.distinct_count': 415.0,
        'http5xx.sum': 539.0,
        'responseTime.p90': 302.0,
      },
    };
    res.json(data);
  });

  router.use(errorHandler());
  return router;
}
