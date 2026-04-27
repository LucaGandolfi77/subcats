import { createId, type MediaAsset } from '@courseweaver/domain';

import { useAuthoringStore } from '../state/useAuthoringStore';

const toDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

interface LibrarySidebarProps {
  onStatus: (message: string) => void;
}

export const LibrarySidebar = ({ onStatus }: LibrarySidebarProps) => {
  const project = useAuthoringStore((state) => state.project);
  const activeSlideId = useAuthoringStore((state) => state.activeSlideId);
  const activeSceneId = useAuthoringStore((state) => state.activeSceneId);
  const setActiveSlide = useAuthoringStore((state) => state.setActiveSlide);
  const addScene = useAuthoringStore((state) => state.addScene);
  const addSlide = useAuthoringStore((state) => state.addSlide);
  const addVariable = useAuthoringStore((state) => state.addVariable);
  const updateVariable = useAuthoringStore((state) => state.updateVariable);
  const addAsset = useAuthoringStore((state) => state.addAsset);

  const handleAssetUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const asset: MediaAsset = {
      id: createId(),
      name: file.name,
      kind: file.type.startsWith('audio/') ? 'audio' : file.type.startsWith('video/') ? 'video' : 'image',
      source: await toDataUrl(file),
      mimeType: file.type
    };

    addAsset(asset);
    onStatus(`Imported asset ${file.name}`);
    event.target.value = '';
  };

  return (
    <aside className="sidebar">
      <section className="panel-card">
        <div className="panel-card__header">
          <h2>Scenes</h2>
          <div className="panel-card__actions">
            <button type="button" onClick={addScene}>+ Scene</button>
            <button type="button" onClick={addSlide}>+ Slide</button>
          </div>
        </div>
        <div className="scene-tree">
          {project.scenes.map((scene) => (
            <div key={scene.id} className={`scene-tree__scene${scene.id === activeSceneId ? ' scene-tree__scene--active' : ''}`}>
              <div className="scene-tree__title">{scene.title}</div>
              <div className="scene-tree__slides">
                {scene.slideIds.map((slideId) => {
                  const slide = project.slides.find((entry) => entry.id === slideId);
                  if (!slide) {
                    return null;
                  }

                  return (
                    <button
                      key={slide.id}
                      type="button"
                      className={`scene-tree__slide${slide.id === activeSlideId ? ' scene-tree__slide--active' : ''}`}
                      onClick={() => setActiveSlide(slide.id)}
                    >
                      <span>{slide.title}</span>
                      <small>{slide.objects.length} objects</small>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="panel-card">
        <div className="panel-card__header">
          <h2>Variables</h2>
          <button type="button" onClick={addVariable}>+ Variable</button>
        </div>
        <div className="stack-list">
          {project.variables.map((variable) => (
            <label key={variable.id} className="stack-list__item">
              <span>{variable.name}</span>
              <input
                value={String(variable.defaultValue)}
                onChange={(event) =>
                  updateVariable(variable.id, (draft) => {
                    draft.defaultValue = typeof draft.defaultValue === 'number'
                      ? Number(event.target.value || 0)
                      : typeof draft.defaultValue === 'boolean'
                        ? event.target.value === 'true'
                        : event.target.value;
                  })
                }
              />
            </label>
          ))}
        </div>
      </section>

      <section className="panel-card">
        <div className="panel-card__header">
          <h2>Assets</h2>
          <label className="panel-card__upload">
            <span>Import</span>
            <input type="file" accept="image/*,audio/*,video/*" onChange={handleAssetUpload} />
          </label>
        </div>
        <div className="stack-list">
          {project.assets.map((asset) => (
            <div key={asset.id} className="stack-list__item stack-list__item--asset">
              <span>{asset.name}</span>
              <small>{asset.kind}</small>
            </div>
          ))}
        </div>
      </section>
    </aside>
  );
};