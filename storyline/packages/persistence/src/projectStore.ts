import { createProject, projectSchema, type ProjectDocument } from '@courseweaver/domain';

import { migrateProjectDocument } from './migrations';

export interface ProjectSnapshot {
  id: string;
  createdAt: string;
  document: ProjectDocument;
}

export const serializeProject = (project: ProjectDocument) => JSON.stringify(projectSchema.parse(project), null, 2);

export const parseProject = (text: string) => migrateProjectDocument(JSON.parse(text));

export const touchProject = (project: ProjectDocument): ProjectDocument => ({
  ...project,
  updatedAt: new Date().toISOString()
});

export const createSnapshot = (project: ProjectDocument): ProjectSnapshot => ({
  id: `${project.id}-${Date.now()}`,
  createdAt: new Date().toISOString(),
  document: touchProject(project)
});

export const createNewProject = (title?: string) => createProject(title);