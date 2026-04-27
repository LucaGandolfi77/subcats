import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createProject, createSlideObject } from '@courseweaver/domain';
import { exportScormProject, exportWebProject } from '@courseweaver/exporter';
import { parseProject } from '@courseweaver/persistence';
import JSZip from 'jszip';
import { JSDOM } from 'jsdom';
import { describe, expect, it } from 'vitest';

const testDirectory = dirname(fileURLToPath(import.meta.url));
const workspaceDirectory = resolve(testDirectory, '..');
const exampleProjectPath = resolve(workspaceDirectory, 'examples/customer-care-foundations.project.json');

const pathExists = async (filePath: string) => {
  try {
    await readFile(filePath);
    return true;
  } catch {
    return false;
  }
};

const createPlayerDistFixture = async (rootDirectory: string) => {
  const playerDistDirectory = resolve(rootDirectory, 'player-dist');
  await mkdir(resolve(playerDistDirectory, 'assets'), { recursive: true });
  await writeFile(resolve(playerDistDirectory, 'index.html'), '<!doctype html><html><body><div id="app"></div></body></html>');
  await writeFile(resolve(playerDistDirectory, 'assets', 'player.js'), 'console.log("courseweaver-player");');
  return playerDistDirectory;
};

describe('export fixtures', () => {
  it('parses the persisted demo project fixture', async () => {
    const project = parseProject(await readFile(exampleProjectPath, 'utf8'));

    expect(project.title).toBe('Customer Care Foundations');
    expect(project.slides).toHaveLength(3);
    expect(project.variables[0]?.name).toBe('go_to_quiz');
    expect(project.assets[0]?.id).toBe('asset-hero-image');
    expect(project.courseMetadata.subject).toBe('Customer support communication');
    expect(project.publishing.scorm.masteryScore).toBe(85);

    const quizObject = project.slides.flatMap((slide) => slide.objects).find((object) => object.kind === 'quiz');
    expect(quizObject?.interaction?.quiz?.correctOptionIds).toEqual(['quiz-option-b']);
  });
});

describe('web exporter', () => {
  it('cleans stale output, writes the bundle, and creates a zip archive', async () => {
    const rootDirectory = await mkdtemp(resolve(tmpdir(), 'courseweaver-export-'));
    const playerDistDirectory = await createPlayerDistFixture(rootDirectory);
    const outputDirectory = resolve(rootDirectory, 'web');

    await mkdir(outputDirectory, { recursive: true });
    await writeFile(resolve(outputDirectory, 'stale.txt'), 'remove me');

    const result = await exportWebProject({
      projectPath: exampleProjectPath,
      outputDirectory,
      playerDistDirectory
    });

    expect(await pathExists(resolve(outputDirectory, 'stale.txt'))).toBe(false);
    expect(result.archivePath).toBe(resolve(rootDirectory, 'web.zip'));

    const exportedProject = parseProject(await readFile(resolve(outputDirectory, 'course.json'), 'utf8'));
    expect(exportedProject.title).toBe('Customer Care Foundations');
    expect(exportedProject.assets[0]?.source.startsWith('data:')).toBe(true);

    const manifest = JSON.parse(await readFile(resolve(outputDirectory, 'manifest.json'), 'utf8')) as {
      assets: { totalAssets: number };
      player: { startSlideId?: string };
    };
    expect(manifest.assets.totalAssets).toBe(1);
    expect(manifest.player.startSlideId).toBe('slide-welcome');

    const assetCatalog = JSON.parse(await readFile(resolve(outputDirectory, 'course-assets.json'), 'utf8')) as Array<{
      id: string;
      sourceType: string;
    }>;
    expect(assetCatalog).toEqual([
      expect.objectContaining({
        id: 'asset-hero-image',
        sourceType: 'inline'
      })
    ]);

    const archive = await JSZip.loadAsync(await readFile(result.archivePath!));
    expect(Object.keys(archive.files)).toEqual(
      expect.arrayContaining(['index.html', 'assets/player.js', 'course.json', 'manifest.json', 'course-assets.json'])
    );
  });

  it('copies local assets into the exported bundle and rewrites their sources', async () => {
    const rootDirectory = await mkdtemp(resolve(tmpdir(), 'courseweaver-assets-'));
    const playerDistDirectory = await createPlayerDistFixture(rootDirectory);
    const outputDirectory = resolve(rootDirectory, 'bundle');
    const localAssetPath = resolve(rootDirectory, 'hero.svg');

    await writeFile(
      localAssetPath,
      "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 10'><rect width='10' height='10' fill='#0b7a75'/></svg>"
    );

    const project = createProject('Local Asset Export');
    const slide = project.slides[0];
    const imageObject = createSlideObject('image', slide.layers[0].id);
    imageObject.assetId = 'asset-local-hero';
    slide.objects.push(imageObject);
    slide.layers[0].objectIds.push(imageObject.id);
    project.assets.push({
      id: 'asset-local-hero',
      name: 'Local Hero',
      kind: 'image',
      source: localAssetPath,
      mimeType: 'image/svg+xml'
    });

    await exportWebProject({
      project,
      outputDirectory,
      playerDistDirectory,
      archiveFileName: false
    });

    const exportedProject = parseProject(await readFile(resolve(outputDirectory, 'course.json'), 'utf8'));
    expect(exportedProject.assets[0]?.source).toBe('./assets/asset-local-hero.svg');
    expect(await readFile(resolve(outputDirectory, 'assets', 'asset-local-hero.svg'), 'utf8')).toContain('#0b7a75');
  });
});

describe('scorm exporter', () => {
  it('wraps the web bundle with a SCORM 1.2 manifest and launch assets', async () => {
    const rootDirectory = await mkdtemp(resolve(tmpdir(), 'courseweaver-scorm-'));
    const playerDistDirectory = await createPlayerDistFixture(rootDirectory);
    const outputDirectory = resolve(rootDirectory, 'scorm');

    const result = await exportScormProject({
      projectPath: exampleProjectPath,
      outputDirectory,
      playerDistDirectory
    });

    expect(result.scormVersion).toBe('1.2');
    expect(result.archivePath).toBe(resolve(rootDirectory, 'scorm.zip'));

    const manifestXml = await readFile(resolve(outputDirectory, 'imsmanifest.xml'), 'utf8');
    const manifestDocument = new JSDOM(manifestXml, { contentType: 'text/xml' }).window.document;
    expect(manifestXml).toContain('<schemaversion>1.2</schemaversion>');
    expect(manifestXml).toContain('adlcp:scormtype="sco"');
    expect(manifestXml).toContain('href="scorm-launch.html"');
    expect(manifestXml).toContain('<file href="course.json" />');
    expect(manifestXml).toContain('<file href="index.html" />');
    expect(manifestXml).toContain('<file href="scorm-api-adapter.js" />');
    expect(manifestXml).toContain('<adlcp:masteryscore>85</adlcp:masteryscore>');
    expect(manifestXml).toContain('<adlcp:maxtimeallowed>0001:00:00</adlcp:maxtimeallowed>');
    expect(manifestXml).toContain('<lom:string language="en">Interactive course project</lom:string>');
    expect(manifestXml).toContain('<lom:string language="en">customer service</lom:string>');
    expect(manifestDocument.querySelector('parsererror')).toBeNull();

    const launchHtml = await readFile(resolve(outputDirectory, 'scorm-launch.html'), 'utf8');
    expect(launchHtml).toContain('<iframe src="./index.html"');
    expect(launchHtml).toContain('CourseWeaverScorm');
    expect(launchHtml).toContain('CourseWeaverScormSettings');
    expect(launchHtml).toContain('Customer support communication');

    const adapterScript = await readFile(resolve(outputDirectory, 'scorm-api-adapter.js'), 'utf8');
    expect(adapterScript).toContain("LMSInitialize");
    expect(adapterScript).toContain("LMSCommit");

    const archive = await JSZip.loadAsync(await readFile(result.archivePath!));
    expect(Object.keys(archive.files)).toEqual(
      expect.arrayContaining(['imsmanifest.xml', 'scorm-launch.html', 'scorm-api-adapter.js', 'course.json', 'index.html'])
    );
  });
});