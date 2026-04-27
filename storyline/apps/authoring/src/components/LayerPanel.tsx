import { useAuthoringStore, selectActiveSlide } from '../state/useAuthoringStore';

export const LayerPanel = () => {
  const activeSlide = useAuthoringStore(selectActiveSlide);
  const selectedLayerId = useAuthoringStore((state) => state.selectedLayerId);
  const setSelectedLayer = useAuthoringStore((state) => state.setSelectedLayer);
  const addLayer = useAuthoringStore((state) => state.addLayer);
  const updateLayer = useAuthoringStore((state) => state.updateLayer);

  return (
    <section className="panel-card panel-card--compact">
      <div className="panel-card__header">
        <h2>Layers</h2>
        <button type="button" onClick={addLayer}>+ Layer</button>
      </div>
      <div className="layer-list">
        {activeSlide.layers.map((layer) => (
          <div key={layer.id} className={`layer-list__item${layer.id === selectedLayerId ? ' layer-list__item--active' : ''}`}>
            <button type="button" className="layer-list__select" onClick={() => setSelectedLayer(layer.id)}>
              <strong>{layer.name}</strong>
              <small>{layer.objectIds.length} objects</small>
            </button>
            <label className="layer-list__checkbox">
              <input
                type="checkbox"
                checked={layer.visibleByDefault}
                onChange={(event) => updateLayer(layer.id, (draft) => {
                  draft.visibleByDefault = event.target.checked;
                })}
              />
              <span>Visible</span>
            </label>
          </div>
        ))}
      </div>
    </section>
  );
};