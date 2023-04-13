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
import { InstanaClient } from '../api';
import { getInstanaConfig } from '../config';
import { createFetchApi } from '@backstage/core-app-api';

export interface RouterOptions {
  logger: Logger;
  config: Config;
}

export async function createRouter(
  options: RouterOptions,
): Promise<express.Router> {
  const instanaConfig = getInstanaConfig(options.config);
  const instanaApi = new InstanaClient(instanaConfig, options.logger);

  const router = Router();
  router.use(express.json());

  router.get('/applications/:applicationId', async (req, res) => {
    const { applicationId } = req.params;
    const data = await instanaApi.getApplicationMetrics(applicationId);
    res.json(data);
  });

  router.get('/services/:serviceId', async (req, res) => {
    const { serviceId } = req.params;
    const data = await instanaApi.getServiceMetrics(serviceId);
    res.json(data);
  });

  router.get('/websites/:websiteId', async (req, res) => {
    const { websiteId } = req.params;
    const data = await instanaApi.getWebsiteMetrics(websiteId);
    res.json(data);
  });

  router.use(errorHandler());
  return router;
}
