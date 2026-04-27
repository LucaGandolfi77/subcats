import { readdir, readFile, writeFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';

import type { ProjectDocument } from '@courseweaver/domain';
import { parseProject } from '@courseweaver/persistence';

import { createArchiveFromExport, exportWebProject, type WebExportOptions, type WebExportResult } from './webExporter';

export const DEFAULT_SCORM_VERSION = '1.2' as const;
export const DEFAULT_SCORM_LAUNCH_FILE = 'scorm-launch.html';
export const DEFAULT_SCORM_API_FILE = 'scorm-api-adapter.js';
export const DEFAULT_SCORM_MANIFEST_FILE = 'imsmanifest.xml';

export type ScormVersion = typeof DEFAULT_SCORM_VERSION;

export interface ScormExportOptions extends WebExportOptions {
  scormVersion?: ScormVersion;
  launchFileName?: string;
  apiAdapterFileName?: string;
}

export interface ScormExportResult extends WebExportResult {
  manifestPath: string;
  launchFilePath: string;
  apiAdapterPath: string;
  scormVersion: ScormVersion;
}

const normalizeBundlePath = (value: string) => value.split('\\').join('/');

const serializeForInlineScript = (value: unknown) => JSON.stringify(value).replaceAll('<', '\\u003c');

const escapeXml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');

const listBundleFiles = async (rootDirectory: string, currentDirectory = rootDirectory): Promise<string[]> => {
  const entries = await readdir(currentDirectory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = resolve(currentDirectory, entry.name);
      if (entry.isDirectory()) {
        return listBundleFiles(rootDirectory, entryPath);
      }

      return [normalizeBundlePath(entryPath.replace(`${rootDirectory}/`, '').replace(`${rootDirectory}\\`, ''))];
    })
  );

  return files.flat().sort((left, right) => left.localeCompare(right));
};

const formatDurationToIso8601 = (minutes?: number) => {
  if (!minutes) {
    return undefined;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours > 0 && remainingMinutes > 0) {
    return `PT${hours}H${remainingMinutes}M`;
  }
  if (hours > 0) {
    return `PT${hours}H`;
  }
  return `PT${remainingMinutes}M`;
};

const buildScormApiAdapter = () => `(() => {
  const findApi = (startWindow) => {
    let currentWindow = startWindow;
    let depth = 0;

    while (currentWindow && depth < 8) {
      try {
        if (currentWindow.API) {
          return currentWindow.API;
        }

        if (!currentWindow.parent || currentWindow.parent === currentWindow) {
          break;
        }

        currentWindow = currentWindow.parent;
        depth += 1;
      } catch {
        break;
      }
    }

    return null;
  };

  const api = findApi(window) || (window.opener ? findApi(window.opener) : null);
  let initialized = false;

  const call = (method, ...args) => {
    if (!api || typeof api[method] !== 'function') {
      return null;
    }

    try {
      return api[method](...args);
    } catch {
      return null;
    }
  };

  const initialize = () => {
    if (!api || initialized) {
      return false;
    }

    call('LMSInitialize', '');
    initialized = true;

    const currentStatus = call('LMSGetValue', 'cmi.core.lesson_status');
    if (!currentStatus || currentStatus === 'not attempted') {
      call('LMSSetValue', 'cmi.core.lesson_status', 'incomplete');
    }

    call('LMSCommit', '');
    return true;
  };

  const commit = () => {
    if (!api || !initialized) {
      return false;
    }

    call('LMSCommit', '');
    return true;
  };

  const complete = () => {
    if (!api || !initialized) {
      return false;
    }

    call('LMSSetValue', 'cmi.core.lesson_status', 'completed');
    call('LMSCommit', '');
    return true;
  };

  const finish = () => {
    if (!api || !initialized) {
      return false;
    }

    call('LMSFinish', '');
    initialized = false;
    return true;
  };

  window.CourseWeaverScorm = {
    apiFound: Boolean(api),
    initialize,
    commit,
    complete,
    finish
  };

  initialize();
  window.addEventListener('beforeunload', () => {
    commit();
    finish();
  });
})();
`;

const buildScormLaunchHtml = (project: ProjectDocument, launchEntry: string, apiAdapterFileName: string) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeXml(project.title)} | SCORM Launch</title>
    <script src="./${escapeXml(apiAdapterFileName)}"></script>
    <script>
      window.CourseWeaverScormSettings = ${serializeForInlineScript({
        courseMetadata: project.courseMetadata,
        scorm: project.publishing.scorm
      })};
    </script>
    <style>
      html, body {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        background: #0f1720;
      }

      iframe {
        border: 0;
        width: 100%;
        height: 100%;
        display: block;
      }
    </style>
  </head>
  <body>
    <iframe src="./${escapeXml(launchEntry)}" title="${escapeXml(project.title)}"></iframe>
    <script>
      window.addEventListener('message', (event) => {
        if (event.data === 'courseweaver-scorm-commit') {
          window.CourseWeaverScorm?.commit?.();
        }

        if (event.data === 'courseweaver-scorm-complete') {
          window.CourseWeaverScorm?.complete?.();
        }
      });
    </script>
  </body>
</html>
`;

export const buildScormManifestXml = (project: ProjectDocument, launchFileName: string, files: string[]) => {
  const learningDuration = formatDurationToIso8601(project.courseMetadata.durationMinutes);
  const keywordsMarkup = project.courseMetadata.keywords
    .map(
      (keyword) => `    <lom:keyword>
      <lom:string language="${escapeXml(project.courseMetadata.language)}">${escapeXml(keyword)}</lom:string>
    </lom:keyword>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<manifest
  identifier="${escapeXml(project.publishing.scorm.packageIdentifier)}"
  version="${project.publishing.scorm.version}"
  xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2"
  xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2"
  xmlns:lom="http://ltsc.ieee.org/xsd/LOM"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.imsproject.org/xsd/imscp_rootv1p1p2 imscp_rootv1p1p2.xsd http://www.adlnet.org/xsd/adlcp_rootv1p2 adlcp_rootv1p2.xsd"
>
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>${project.publishing.scorm.version}</schemaversion>
    <lom:lom>
      <lom:general>
        <lom:title>
          <lom:string language="${escapeXml(project.courseMetadata.language)}">${escapeXml(project.title)}</lom:string>
        </lom:title>
        <lom:description>
          <lom:string language="${escapeXml(project.courseMetadata.language)}">${escapeXml(project.description)}</lom:string>
        </lom:description>
${keywordsMarkup}
      </lom:general>
      <lom:educational>
        <lom:description>
          <lom:string language="${escapeXml(project.courseMetadata.language)}">${escapeXml(project.courseMetadata.subject)}</lom:string>
        </lom:description>
${learningDuration ? `        <lom:typicalLearningTime>
          <lom:duration>${learningDuration}</lom:duration>
        </lom:typicalLearningTime>` : ''}
      </lom:educational>
      <lom:rights>
        <lom:description>
          <lom:string language="${escapeXml(project.courseMetadata.language)}">${escapeXml(project.courseMetadata.provider)}</lom:string>
        </lom:description>
      </lom:rights>
    </lom:lom>
  </metadata>
  <organizations default="courseweaver-organization">
    <organization identifier="courseweaver-organization">
      <title>${escapeXml(project.publishing.scorm.organizationTitle)}</title>
      <item identifier="courseweaver-item" identifierref="courseweaver-resource" isvisible="true">
        <title>${escapeXml(project.publishing.scorm.itemTitle)}</title>
        <adlcp:masteryscore>${project.publishing.scorm.masteryScore}</adlcp:masteryscore>
${project.publishing.scorm.maxTimeAllowed ? `        <adlcp:maxtimeallowed>${escapeXml(project.publishing.scorm.maxTimeAllowed)}</adlcp:maxtimeallowed>` : ''}
        <adlcp:timelimitaction>${escapeXml(project.publishing.scorm.timeLimitAction)}</adlcp:timelimitaction>
${project.publishing.scorm.dataFromLms ? `        <adlcp:datafromlms>${escapeXml(project.publishing.scorm.dataFromLms)}</adlcp:datafromlms>` : ''}
      </item>
    </organization>
  </organizations>
  <resources>
    <resource identifier="courseweaver-resource" type="webcontent" adlcp:scormtype="sco" href="${escapeXml(launchFileName)}">
${files.map((file) => `      <file href="${escapeXml(file)}" />`).join('\n')}
    </resource>
  </resources>
</manifest>
`;
};

const getDefaultScormArchiveName = (outputDirectory: string) => {
  const directoryName = basename(outputDirectory);
  return `${directoryName === 'scorm' || directoryName.endsWith('-scorm') ? directoryName : `${directoryName}-scorm`}.zip`;
};

export const exportScormProject = async (options: ScormExportOptions): Promise<ScormExportResult> => {
  const outputDirectory = resolve(options.outputDirectory);
  const launchFileName = options.launchFileName ?? DEFAULT_SCORM_LAUNCH_FILE;
  const apiAdapterFileName = options.apiAdapterFileName ?? DEFAULT_SCORM_API_FILE;

  const webResult = await exportWebProject({
    ...options,
    archiveFileName: false
  });

  const project = parseProject(await readFile(resolve(outputDirectory, 'course.json'), 'utf8'));
  const launchFilePath = resolve(outputDirectory, launchFileName);
  const apiAdapterPath = resolve(outputDirectory, apiAdapterFileName);
  const manifestPath = resolve(outputDirectory, DEFAULT_SCORM_MANIFEST_FILE);

  await writeFile(apiAdapterPath, buildScormApiAdapter());
  await writeFile(launchFilePath, buildScormLaunchHtml(project, webResult.manifest.entry, apiAdapterFileName));

  const scormFiles = await listBundleFiles(outputDirectory);
  await writeFile(
    manifestPath,
    buildScormManifestXml(project, launchFileName, [...scormFiles, DEFAULT_SCORM_MANIFEST_FILE])
  );

  const archivePath = await createArchiveFromExport(
    outputDirectory,
    options.archiveFileName === undefined ? getDefaultScormArchiveName(outputDirectory) : options.archiveFileName
  );

  return {
    ...webResult,
    archivePath,
    manifestPath,
    launchFilePath,
    apiAdapterPath,
    scormVersion: options.scormVersion ?? DEFAULT_SCORM_VERSION
  };
};