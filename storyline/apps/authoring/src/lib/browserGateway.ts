import type { ProjectDocument } from '@courseweaver/domain';
import { parseProject, serializeProject } from '@courseweaver/persistence';

type PickerWindow = Window & {
  showOpenFilePicker?: (options?: unknown) => Promise<Array<{ getFile: () => Promise<File> }>>;
  showSaveFilePicker?: (options?: unknown) => Promise<{
    createWritable: () => Promise<{
      write: (content: string) => Promise<void>;
      close: () => Promise<void>;
    }>;
  }>;
};

let lastSaveHandle: Awaited<ReturnType<NonNullable<PickerWindow['showSaveFilePicker']>>> | undefined;

const downloadBlob = (filename: string, blob: Blob) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const getSuggestedName = (project: ProjectDocument) =>
  `${project.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'courseweaver-project'}.project.json`;

export const saveProjectFile = async (project: ProjectDocument) => {
  const content = serializeProject(project);
  const filename = getSuggestedName(project);
  const windowWithPicker = window as PickerWindow;

  if (lastSaveHandle) {
    const writable = await lastSaveHandle.createWritable();
    await writable.write(content);
    await writable.close();
    return filename;
  }

  if (windowWithPicker.showSaveFilePicker) {
    lastSaveHandle = await windowWithPicker.showSaveFilePicker({
      suggestedName: filename,
      types: [
        {
          description: 'CourseWeaver Project',
          accept: { 'application/json': ['.json'] }
        }
      ]
    });

    const writable = await lastSaveHandle.createWritable();
    await writable.write(content);
    await writable.close();
    return filename;
  }

  downloadBlob(filename, new Blob([content], { type: 'application/json' }));
  return filename;
};

export const exportProjectJson = async (project: ProjectDocument) => {
  const filename = getSuggestedName(project);
  downloadBlob(filename, new Blob([serializeProject(project)], { type: 'application/json' }));
  return filename;
};

const readProjectFromFile = async (file: File) => parseProject(await file.text());

export const openProjectFile = async (): Promise<ProjectDocument | undefined> => {
  const windowWithPicker = window as PickerWindow;

  if (windowWithPicker.showOpenFilePicker) {
    const [handle] = await windowWithPicker.showOpenFilePicker({
      multiple: false,
      types: [
        {
          description: 'CourseWeaver Project',
          accept: { 'application/json': ['.json'] }
        }
      ]
    });

    if (!handle) {
      return undefined;
    }

    return readProjectFromFile(await handle.getFile());
  }

  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.onchange = async () => {
      const file = input.files?.[0];
      resolve(file ? await readProjectFromFile(file) : undefined);
    };
    input.click();
  });
};