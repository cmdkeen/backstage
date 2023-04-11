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
import { InstanaConfig } from '../config';
import { Logger } from 'winston';
import { InstanaApi, InstanaMetrics } from './InstanaApi';
import { NotImplementedError } from '@backstage/errors';

interface InstanaResponse {
  metrics: { [key: string]: number[][] };
}

export class InstanaClient implements InstanaApi {
  private readonly config: InstanaConfig;
  private readonly logger: Logger;

  public constructor(config: InstanaConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;
  }

  public async getApplicationMetrics(
    applicationId: string,
  ): Promise<InstanaMetrics> {
    throw new NotImplementedError();
  }

  public async getWebsiteMetrics(websiteId: string): Promise<InstanaMetrics> {
    const windowSize = 86400000;
    // Instana API can only fetch 5 different metric+aggregation pairs at a time
    const body = {
      metrics: [
        { metric: 'uniqueUsers', aggregation: 'DISTINCT_COUNT' },
        { metric: 'uniqueSessions', aggregation: 'DISTINCT_COUNT' },
        { metric: 'errors', aggregation: 'SUM' },
        { metric: 'http5xx', aggregation: 'SUM' },
        { metric: 'responseTime', aggregation: 'P90' },
      ],
      type: 'PAGELOAD',
      timeFrame: {
        windowSize: windowSize,
      },
      tagFilterExpression: {
        type: 'TAG_FILTER',
        entity: 'NOT_APPLICABLE',
        name: 'beacon.website.id',
        operator: 'EQUALS',
        value: websiteId,
      },
    };

    const response = await this.callApi<InstanaResponse>(
      'api/website-monitoring/v2/metrics',
      body,
    );
    const metrics = {};
    Object.keys(response.metrics).forEach((k, _) => {
      metrics[k] = response.metrics[k][0][1];
    });

    return {
      entityId: websiteId,
      entityType: 'website',
      windowSize: windowSize,
      metrics: metrics,
    };
  }

  private async callApi<T>(path: string, body: any): Promise<T> {
    const baseUrl = `${this.config.baseUrl}/`;
    const url = new URL(path, baseUrl);

    this.logger.info(`Calling ${url}`);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `apiToken ${this.config.token}`,
      },
      body: JSON.stringify(body),
    });

    if (response.ok) {
      return (await response.json()) as T;
    }

    this.logger.warn(
      `Instana response: ${response.status}: ${response.statusText}`,
    );
    throw new Error(response.statusText);
  }
}
