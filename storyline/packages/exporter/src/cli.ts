import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { exportScormProject } from './scormExporter';
import { DEMO_PROJECT_FILENAME, exportWebProject } from './webExporter';

const args = process.argv.slice(2);

const readOption = (flag: string) => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
};

const hasFlag = (flag: string) => args.includes(flag);

const outputDirectory = readOption('--output') ?? 'dist/web-export';
const projectPath = readOption('--project');
const playerDistDirectory = readOption('--player-dist') ?? 'apps/player/dist';
const archiveFileName = readOption('--archive-name');
const target = (readOption('--target') ?? 'web').toLowerCase();
const useDemoProject = hasFlag('--demo');
const demoProjectPath = resolve('examples', DEMO_PROJECT_FILENAME);

if (target !== 'web' && target !== 'scorm') {
  console.error(`Unsupported export target: ${target}. Use --target web or --target scorm.`);
  process.exit(1);
}

if (!existsSync(resolve(playerDistDirectory))) {
  console.error(`Player build not found at ${playerDistDirectory}. Run npm run build:player first.`);
  process.exit(1);
}

try {
  const sharedOptions = {
    outputDirectory,
    playerDistDirectory,
    projectPath: useDemoProject ? (existsSync(demoProjectPath) ? demoProjectPath : undefined) : projectPath,
    archiveFileName
  };

  const result =
    target === 'scorm'
      ? await exportScormProject(sharedOptions)
      : await exportWebProject(sharedOptions);

  console.log(`Exported ${target} package to ${result.outputDirectory}`);
  console.log(`Manifest written for ${result.manifest.title}`);
  if ('manifestPath' in result) {
    console.log(`SCORM manifest created at ${result.manifestPath}`);
  }
  if (result.archivePath) {
    console.log(`Archive created at ${result.archivePath}`);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Unexpected export error');
  process.exit(1);
}