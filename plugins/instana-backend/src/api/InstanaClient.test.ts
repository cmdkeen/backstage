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
import { getVoidLogger } from '@backstage/backend-common';
import { setupRequestMockHandlers } from '@backstage/backend-test-utils';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { InstanaClient } from './InstanaClient';
import { ConfigReader } from '@backstage/core-app-api';
import { getInstanaConfig } from '../config';
import { NotFoundError } from '@backstage/errors';

describe('InstanaClient', () => {
  const server = setupServer();
  setupRequestMockHandlers(server);

  const mockBaseUrl = 'http://test-instana.io';
  const mockToken = 'abcdef';
  const windowSize = 132456;
  const config = new ConfigReader({
    instana: {
      baseUrl: mockBaseUrl,
      token: mockToken,
      windowSize: 132456,
    },
  });
  const instanaConfig = getInstanaConfig(config);
  const logger = getVoidLogger();

  // Empty service and application are identical
  const mockEmptyApplicationOrService = {
    items: [],
    page: 1,
    pageSize: 20,
    totalHits: 0,
    adjustedTimeframe: {
      windowSize: windowSize,
    },
  };

  const mockApplication = {
    items: [
      {
        application: {
          id: 'xyz123',
        },
        metrics: {
          'latency.p90': [[132, 25.0]],
          'calls.per_second': [[132, 5.26483451536643]],
          'latency.mean': [[132, 323.4512522311155]],
          'latency.p99': [[132, 47.0]],
          'latency.p50': [[132, 10.0]],
        },
      },
    ],
    page: 1,
    pageSize: 20,
    totalHits: 1,
    adjustedTimeframe: {
      windowSize: windowSize,
    },
  };

  const mockService = {
    items: [
      {
        service: {
          id: 'service123',
          label: 'Service 123',
          types: [],
          technologies: [],
          entityType: 'SERVICE',
          snapshotIds: [],
        },
        metrics: {
          'latency.p90': [[132, 25.0]],
          'calls.per_second': [[132, 5.26483451536643]],
          'latency.mean': [[132, 323.4512522311155]],
          'latency.p99': [[132, 47.0]],
          'latency.p50': [[132, 10.0]],
        },
      },
    ],
    page: 1,
    pageSize: 20,
    totalHits: 1,
    adjustedTimeframe: {
      windowSize: windowSize,
    },
  };

  // Websites filter on tag so for some metrics return 0s - responseTime however is an empty array
  const mockEmptyWebsite = {
    metrics: {
      'uniqueUsers.distinct_count': [[321, 0.0]],
      'uniqueSessions.distinct_count': [[321, 0.0]],
      'errors.sum': [[321, 0.0]],
      'http5xx.sum': [[321, 0.0]],
      'responseTime.p90': [],
    },
    adjustedTimeframe: {
      windowSize: windowSize,
    },
  };

  const mockWebsite = {
    metrics: {
      'uniqueUsers.distinct_count': [[321, 5.0]],
      'uniqueSessions.distinct_count': [[321, 23.0]],
      'errors.sum': [[321, 1.0]],
      'http5xx.sum': [[321, 0.0]],
      'responseTime.p90': [[321, 2.0]],
    },
    adjustedTimeframe: {
      windowSize: windowSize,
    },
  };

  const setupHandlers = () => {
    server.use(
      rest.post(
        `${mockBaseUrl}/api/application-monitoring/metrics/applications`,
        async (req, res, ctx) => {
          const { applicationId } = await req.json();
          switch (applicationId) {
            case 'foo':
              return res(ctx.json(mockEmptyApplicationOrService));
            case 'xyz123':
              return res(ctx.json(mockApplication));
            default:
              return res(ctx.status(400));
          }
        },
      ),
      rest.post(
        `${mockBaseUrl}/api/application-monitoring/metrics/services`,
        async (req, res, ctx) => {
          const { serviceId } = await req.json();
          switch (serviceId) {
            case 'foo':
              return res(ctx.json(mockEmptyApplicationOrService));
            case 'service123':
              return res(ctx.json(mockService));
            default:
              return res(ctx.status(400));
          }
        },
      ),
      rest.post(
        `${mockBaseUrl}/api/website-monitoring/v2/metrics`,
        async (req, res, ctx) => {
          const { tagFilterExpression } = await req.json();
          switch (tagFilterExpression.value) {
            case 'foo':
              return res(ctx.json(mockEmptyWebsite));
            case 'website123':
              return res(ctx.json(mockWebsite));
            default:
              return res(ctx.status(400));
          }
        },
      ),
    );
  };

  it('should throw NotFoundError if no application', async () => {
    setupHandlers();
    const api = new InstanaClient(instanaConfig, logger);
    await expect(api.getApplicationMetrics('foo')).rejects.toThrow(
      NotFoundError,
    );
  });

  it('should return mapped metrics if matched application', async () => {
    setupHandlers();
    const api = new InstanaClient(instanaConfig, logger);
    expect(await api.getApplicationMetrics('xyz123')).toEqual({
      entityId: 'xyz123',
      entityType: 'application',
      windowSize: windowSize,
      metrics: {
        'latency.p90': 25.0,
        'calls.per_second': 5.26483451536643,
        'latency.p99': 47,
        'latency.mean': 323.4512522311155,
        'latency.p50': 10.0,
      },
    });
  });

  it('should throw NotFoundError if no service', async () => {
    setupHandlers();
    const api = new InstanaClient(instanaConfig, logger);
    await expect(api.getServiceMetrics('foo')).rejects.toThrow(NotFoundError);
  });

  it('should return mapped metrics if matched service', async () => {
    setupHandlers();
    const api = new InstanaClient(instanaConfig, logger);
    expect(await api.getServiceMetrics('service123')).toEqual({
      entityId: 'service123',
      entityType: 'service',
      windowSize: windowSize,
      metrics: {
        'latency.p90': 25.0,
        'calls.per_second': 5.26483451536643,
        'latency.p99': 47,
        'latency.mean': 323.4512522311155,
        'latency.p50': 10.0,
      },
    });
  });

  it('should throw NotFoundError if no website', async () => {
    setupHandlers();
    const api = new InstanaClient(instanaConfig, logger);
    await expect(api.getWebsiteMetrics('foo')).rejects.toThrow(NotFoundError);
  });

  it('should return mapped metrics if matched website', async () => {
    setupHandlers();
    const api = new InstanaClient(instanaConfig, logger);
    expect(await api.getWebsiteMetrics('website123')).toEqual({
      entityId: 'website123',
      entityType: 'website',
      windowSize: windowSize,
      metrics: {
        'uniqueUsers.distinct_count': 5,
        'uniqueSessions.distinct_count': 23,
        'errors.sum': 1,
        'http5xx.sum': 0,
        'responseTime.p90': 2,
      },
    });
  });
});
