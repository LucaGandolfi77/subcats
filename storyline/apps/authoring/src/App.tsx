import { parseProject, serializeProject } from '@courseweaver/persistence';
import { useEffect, useMemo, useState } from 'react';

import { CanvasStage } from './components/CanvasStage';
import { LayerPanel } from './components/LayerPanel';
import { LibrarySidebar } from './components/LibrarySidebar';
import { PreviewModal } from './components/PreviewModal';
import { PropertiesPanel } from './components/PropertiesPanel';
import { Toolbar } from './components/Toolbar';
import { exportProjectJson, openProjectFile, saveProjectFile } from './lib/browserGateway';
import { useAuthoringStore } from './state/useAuthoringStore';

const AUTOSAVE_KEY = 'courseweaver:autosave';

export const App = () => {
  const project = useAuthoringStore((state) => state.project);
  const hydrateProject = useAuthoringStore((state) => state.hydrateProject);
  const createBlankProject = useAuthoringStore((state) => state.createBlankProject);
  const addObject = useAuthoringStore((state) => state.addObject);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [status, setStatus] = useState('Autosave ready. Web package export is available through the CLI exporter.');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const autosave = window.localStorage.getItem(AUTOSAVE_KEY);
    if (autosave) {
      try {
        hydrateProject(parseProject(autosave));
        setStatus('Recovered the last autosave snapshot.');
      } catch {
        setStatus('Ignored a corrupt autosave snapshot.');
      }
    }
    setHydrated(true);
  }, [hydrateProject]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    window.localStorage.setItem(AUTOSAVE_KEY, serializeProject(project));
  }, [hydrated, project]);

  const exportCommand = useMemo(
    () => `npm run build:player && tsx packages/exporter/src/cli.ts --project ${project.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}\.project.json --output dist/exported-course`,
    [project.title]
  );

  return (
    <main className="authoring-app">
      <Toolbar
        onCreateNew={() => {
          createBlankProject();
          setStatus('Started a blank project.');
        }}
        onSave={async () => {
          const filename = await saveProjectFile(project);
          setStatus(`Saved ${filename}.`);
        }}
        onLoad={async () => {
          const loadedProject = await openProjectFile();
          if (loadedProject) {
            hydrateProject(loadedProject);
            setStatus(`Loaded ${loadedProject.title}.`);
          }
        }}
        onPreview={() => setPreviewOpen(true)}
        onExport={async () => {
          const filename = await exportProjectJson(project);
          setStatus(`Exported ${filename}. Package it for the web with: ${exportCommand}`);
        }}
        onAddObject={(kind) => {
          addObject(kind);
          setStatus(`Inserted ${kind} object on the active layer.`);
        }}
      />

      <div className="authoring-app__shell">
        <LibrarySidebar onStatus={setStatus} />

        <section className="workspace">
          <CanvasStage />
          <LayerPanel />
          <section className="panel-card panel-card--note">
            <div className="panel-card__header">
              <h2>Packaging</h2>
              <div className="panel-card__meta">CLI</div>
            </div>
            <p>
              The authoring app exports clean project JSON in-browser. The production-minded web package flow is handled by the Node exporter so the editor stays browser-portable while the publish path remains deterministic.
            </p>
            <code>{exportCommand}</code>
          </section>
        </section>

        <PropertiesPanel />
      </div>

      <footer className="statusbar">
        <span>{status}</span>
      </footer>

      {previewOpen ? <PreviewModal project={project} onClose={() => setPreviewOpen(false)} /> : null}
    </main>
  );
};