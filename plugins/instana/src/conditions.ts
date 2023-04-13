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
import { Entity } from '@backstage/catalog-model';
import { INSTANA_APPLICATION_ID_ANNOTATION } from './constants';

/**
 * Checks if an entity contains an annotation for Instana.
 * @param entity - The entity to check if the annotation exists
 * @returns If an annotation exists or not
 * @public
 */
export function isInstanaAvailable(entity: Entity): boolean {
  return Boolean(
    entity.metadata.annotations?.hasOwnProperty(
      INSTANA_APPLICATION_ID_ANNOTATION,
    ),
  );
}
