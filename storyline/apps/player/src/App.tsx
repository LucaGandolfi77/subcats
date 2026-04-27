import { createDemoProject, projectSchema, type ProjectDocument } from '@courseweaver/domain';
import { mountRuntimePlayer } from '@courseweaver/runtime';
import { useEffect, useRef, useState } from 'react';

const loadProjectFromQuery = async (): Promise<ProjectDocument | undefined> => {
  const query = new URLSearchParams(window.location.search);
  const courseUrl = query.get('course');
  if (!courseUrl) {
    return undefined;
  }

  const response = await fetch(courseUrl);
  if (!response.ok) {
    throw new Error(`Unable to load course from ${courseUrl}`);
  }

  const payload = await response.json();
  return projectSchema.parse(payload);
};

const loadProjectFromExportBundle = async (): Promise<ProjectDocument | undefined> => {
  const response = await fetch('./course.json');
  if (!response.ok) {
    return undefined;
  }

  const payload = await response.json();
  return projectSchema.parse(payload);
};

export const App = () => {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [project, setProject] = useState<ProjectDocument>(createDemoProject());
  const [status, setStatus] = useState('Showing bundled demo course');

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([loadProjectFromQuery(), loadProjectFromExportBundle()])
      .then(([queryResult, exportBundleResult]) => {
        const loadedProject =
          queryResult.status === 'fulfilled' && queryResult.value
            ? queryResult.value
            : exportBundleResult.status === 'fulfilled'
              ? exportBundleResult.value
              : undefined;

        if (!cancelled && loadedProject) {
          setProject(loadedProject);
          setStatus(
            queryResult.status === 'fulfilled' && queryResult.value
              ? 'Loaded course from query parameter'
              : 'Loaded course from exported package'
          );
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setStatus(error instanceof Error ? error.message : 'Unable to load external course');
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hostRef.current) {
      return;
    }

    const controller = mountRuntimePlayer(hostRef.current, project, { mode: 'standalone' });
    return () => controller.dispose();
  }, [project]);

  return (
    <main className="player-app">
      <header className="player-app__header">
        <div>
          <p className="player-app__eyebrow">Runtime Surface</p>
          <h1>CourseWeaver Player</h1>
          <p>{status}</p>
        </div>
        <label className="player-app__upload">
          <span>Open project JSON</span>
          <input
            type="file"
            accept="application/json"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) {
                return;
              }

              const text = await file.text();
              setProject(projectSchema.parse(JSON.parse(text)));
              setStatus(`Loaded ${file.name}`);
            }}
          />
        </label>
      </header>
      <div className="player-app__surface" ref={hostRef} />
    </main>
  );
};