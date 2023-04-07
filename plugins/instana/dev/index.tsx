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
import React from 'react';
import { Entity } from '@backstage/catalog-model';
import { EntityProvider } from '@backstage/plugin-catalog-react';
import { createDevApp } from '@backstage/dev-utils';
import { TestApiProvider } from '@backstage/test-utils';
import { instanaPlugin, InstanaPage } from '../src/plugin';
import { InstanaApi, instanaApiRef } from '../src';

const mockEntity: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: {
    name: 'backstage',
    description: 'backstage.io',
    annotations: {},
  },
  spec: {
    lifecycle: 'production',
    type: 'service',
    owner: 'user:guest',
  },
};

class MockInstanaClient implements InstanaApi {
  async getHealth(): Promise<{ status: string }> {
    return { status: 'ok' };
  }
}

createDevApp()
  .registerPlugin(instanaPlugin)
  .addPage({
    path: '/fixture-1',
    title: 'Fixture-1',
    element: (
      <TestApiProvider apis={[[instanaApiRef, new MockInstanaClient()]]}>
        <EntityProvider entity={mockEntity}>
          <InstanaPage />
        </EntityProvider>
      </TestApiProvider>
    ),
  })
  .render();
