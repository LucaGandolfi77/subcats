import { copyFile, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { basename, dirname, extname, relative, resolve } from 'node:path';

import { buildAssetManifest, collectReferencedAssets } from '@courseweaver/assets';
import { createDemoProject, type ProjectDocument } from '@courseweaver/domain';
import { parseProject, serializeProject } from '@courseweaver/persistence';
import JSZip from 'jszip';

export const DEMO_PROJECT_FILENAME = 'customer-care-foundations.project.json';
export const DEFAULT_WEB_ARCHIVE_FILENAME = 'courseweaver-web-package.zip';

export interface ExportManifest {
  formatVersion: string;
  title: string;
  projectId: string;
  generatedAt: string;
  assets: ReturnType<typeof buildAssetManifest>;
  entry: string;
  player: {
    startSlideId?: string;
    width: number;
    height: number;
  };
}

export interface WebExportOptions {
  project?: ProjectDocument;
  projectPath?: string;
  outputDirectory: string;
  playerDistDirectory?: string;
  archiveFileName?: string | false;
}

export interface WebExportResult {
  outputDirectory: string;
  manifest: ExportManifest;
  archivePath?: string;
}

interface LoadedProject {
  project: ProjectDocument;
  baseDirectory: string;
}

const ensureDirectory = async (directoryPath: string) => {
  await mkdir(directoryPath, { recursive: true });
};

const normalizeBundlePath = (value: string) => value.split('\\').join('/');

const isInlineAssetSource = (source: string) => source.startsWith('data:');

const isRemoteAssetSource = (source: string) => /^https?:\/\//i.test(source);

const guessAssetExtension = (source: string, mimeType?: string) => {
  const sourceExtension = extname(source);
  if (sourceExtension) {
    return sourceExtension;
  }

  switch (mimeType) {
    case 'image/svg+xml':
      return '.svg';
    case 'image/png':
      return '.png';
    case 'image/jpeg':
      return '.jpg';
    case 'audio/mpeg':
      return '.mp3';
    case 'video/mp4':
      return '.mp4';
    default:
      return '';
  }
};

const resolveArchivePath = (outputDirectory: string, archiveFileName?: string | false) => {
  if (archiveFileName === false) {
    return undefined;
  }

  if (archiveFileName) {
    return resolve(dirname(outputDirectory), archiveFileName.endsWith('.zip') ? archiveFileName : `${archiveFileName}.zip`);
  }

  return resolve(dirname(outputDirectory), `${basename(outputDirectory)}.zip`);
};

const copyDirectory = async (sourceDirectory: string, targetDirectory: string) => {
  const sourceStat = await stat(sourceDirectory);
  if (!sourceStat.isDirectory()) {
    throw new Error(`Player dist path is not a directory: ${sourceDirectory}`);
  }

  await rm(targetDirectory, { recursive: true, force: true });
  await ensureDirectory(targetDirectory);

  if (typeof Bun !== 'undefined') {
    throw new Error('Bun runtime is not supported for export packaging in this workspace.');
  }

  const fs = await import('node:fs/promises');
  await fs.cp(sourceDirectory, targetDirectory, { recursive: true });
};

const loadProject = async (options: WebExportOptions): Promise<LoadedProject> => {
  if (options.project) {
    return {
      project: options.project,
      baseDirectory: process.cwd()
    };
  }

  if (options.projectPath) {
    const projectText = await readFile(options.projectPath, 'utf8');
    return {
      project: parseProject(projectText),
      baseDirectory: dirname(resolve(options.projectPath))
    };
  }

  return {
    project: createDemoProject(),
    baseDirectory: process.cwd()
  };
};

const packageAssetSource = async (
  source: string,
  baseDirectory: string,
  outputDirectory: string,
  assetId: string,
  mimeType?: string
) => {
  if (isInlineAssetSource(source) || isRemoteAssetSource(source)) {
    return source;
  }

  const extension = guessAssetExtension(source, mimeType);
  const assetOutputDirectory = resolve(outputDirectory, 'assets');
  const targetFileName = `${assetId}${extension}`;
  const sourcePath = resolve(baseDirectory, source);
  const targetPath = resolve(assetOutputDirectory, targetFileName);

  await ensureDirectory(assetOutputDirectory);
  await copyFile(sourcePath, targetPath);

  return `./assets/${targetFileName}`;
};

const prepareProjectForExport = async (project: ProjectDocument, baseDirectory: string, outputDirectory: string) => {
  const packagedProject = structuredClone(project) as ProjectDocument;

  await Promise.all(
    packagedProject.assets.map(async (asset) => {
      asset.source = await packageAssetSource(asset.source, baseDirectory, outputDirectory, asset.id, asset.mimeType);
    })
  );

  return packagedProject;
};

const addDirectoryToArchive = async (zip: JSZip, currentDirectory: string, rootDirectory: string) => {
  const entries = await readdir(currentDirectory, { withFileTypes: true });

  await Promise.all(
    entries.map(async (entry) => {
      const entryPath = resolve(currentDirectory, entry.name);
      if (entry.isDirectory()) {
        await addDirectoryToArchive(zip, entryPath, rootDirectory);
        return;
      }

      zip.file(normalizeBundlePath(relative(rootDirectory, entryPath)), await readFile(entryPath));
    })
  );
};

export const createArchiveFromExport = async (outputDirectory: string, archiveFileName?: string | false) => {
  const archivePath = resolveArchivePath(outputDirectory, archiveFileName);
  if (!archivePath) {
    return undefined;
  }

  const archive = new JSZip();
  await addDirectoryToArchive(archive, outputDirectory, outputDirectory);

  const archiveBuffer = await archive.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 }
  });

  await writeFile(archivePath, archiveBuffer);
  return archivePath;
};

export const buildExportManifest = (project: ProjectDocument): ExportManifest => ({
  formatVersion: '1.0.0',
  title: project.title,
  projectId: project.id,
  generatedAt: new Date().toISOString(),
  assets: buildAssetManifest(project),
  entry: 'index.html',
  player: {
    startSlideId: project.playerSettings.startSlideId,
    width: project.playerSettings.width,
    height: project.playerSettings.height
  }
});

export const exportWebProject = async (options: WebExportOptions) => {
  const { project, baseDirectory } = await loadProject(options);
  const outputDirectory = resolve(options.outputDirectory);
  const playerDistDirectory = resolve(options.playerDistDirectory ?? 'apps/player/dist');

  await copyDirectory(playerDistDirectory, outputDirectory);
  await ensureDirectory(dirname(resolve(outputDirectory, 'course.json')));

  const packagedProject = await prepareProjectForExport(project, baseDirectory, outputDirectory);
  const manifest = buildExportManifest(packagedProject);
  const referencedAssets = collectReferencedAssets(packagedProject);

  await writeFile(resolve(outputDirectory, 'course.json'), serializeProject(packagedProject));
  await writeFile(resolve(outputDirectory, 'manifest.json'), JSON.stringify(manifest, null, 2));
  await writeFile(
    resolve(outputDirectory, 'course-assets.json'),
    JSON.stringify(
      referencedAssets.map((asset) => ({
        id: asset.id,
        name: asset.name,
        kind: asset.kind,
        source: asset.source,
        sourceType: isInlineAssetSource(asset.source) ? 'inline' : isRemoteAssetSource(asset.source) ? 'remote' : 'packaged'
      })),
      null,
      2
    )
  );

  const archivePath = await createArchiveFromExport(outputDirectory, options.archiveFileName);

  return {
    outputDirectory,
    manifest,
    archivePath
  } satisfies WebExportResult;
};