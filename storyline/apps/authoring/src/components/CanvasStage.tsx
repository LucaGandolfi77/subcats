import { useRef } from 'react';

import { useAuthoringStore, selectActiveSlide, selectSelectedObject } from '../state/useAuthoringStore';

const kindLabel: Record<string, string> = {
  tabs: 'Tabs',
  accordion: 'Accordion',
  slider: 'Slider',
  marker: 'Marker',
  dragDrop: 'Drag & Drop',
  branchingScenario: 'Branching',
  quiz: 'Quiz'
};

const resolveObjectAppearance = (object: ReturnType<typeof selectActiveSlide>['objects'][number]) => {
  const activeState = object.states.find((state) => state.id === object.defaultStateId);
  return {
    ...object,
    visible: activeState?.visibility ?? object.visible,
    text: activeState?.text ?? object.text,
    style: {
      ...object.style,
      ...activeState?.style
    }
  };
};

export const CanvasStage = () => {
  const activeSlide = useAuthoringStore(selectActiveSlide);
  const theme = useAuthoringStore((state) => state.project.theme);
  const selectedObject = useAuthoringStore(selectSelectedObject);
  const selectObject = useAuthoringStore((state) => state.selectObject);
  const moveObject = useAuthoringStore((state) => state.moveObject);
  const stageRef = useRef<HTMLDivElement | null>(null);

  const beginDrag = (event: React.PointerEvent<HTMLDivElement>, objectId: string, originX: number, originY: number) => {
    event.stopPropagation();
    const startX = event.clientX;
    const startY = event.clientY;

    const handleMove = (moveEvent: PointerEvent) => {
      moveObject(objectId, originX + (moveEvent.clientX - startX), originY + (moveEvent.clientY - startY));
    };

    const handleUp = () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  };

  return (
    <section className="panel-card panel-card--canvas">
      <div className="panel-card__header">
        <div>
          <h2>{activeSlide.title}</h2>
          <p>{activeSlide.notes || 'Design the active slide on a fixed stage and preview responsive playback separately.'}</p>
        </div>
        <div className="panel-card__meta">{activeSlide.objects.length} objects</div>
      </div>

      <div className="stage-host" onClick={() => selectObject(undefined)}>
        <div
          className="stage-canvas"
          ref={stageRef}
          style={{
            width: 1280,
            height: 720,
            background: activeSlide.background || theme.colors.canvas
          }}
        >
          {activeSlide.layers.map((layer) => (
            <div key={layer.id} className="stage-layer">
              {layer.objectIds
                .map((objectId) => activeSlide.objects.find((entry) => entry.id === objectId))
                .filter(Boolean)
                .map((entry) => {
                  const object = resolveObjectAppearance(entry!);
                  if (!object.visible) {
                    return null;
                  }

                  return (
                    <div
                      key={object.id}
                      className={`stage-object stage-object--${object.kind}${selectedObject?.id === object.id ? ' stage-object--selected' : ''}`}
                      style={{
                        left: object.position.x,
                        top: object.position.y,
                        width: object.position.width,
                        height: object.position.height,
                        background: object.style.fill || (object.kind === 'image' ? 'rgba(11,122,117,0.08)' : 'transparent'),
                        color: object.style.textColor || '#18211f',
                        borderColor: object.style.stroke || 'rgba(16,33,28,0.14)',
                        borderWidth: object.style.stroke ? object.style.strokeWidth ?? 1 : 1,
                        borderRadius: object.style.borderRadius ?? 16,
                        fontSize: object.style.fontSize ?? 16,
                        fontWeight: object.style.fontWeight ?? 500,
                        padding: object.style.padding ?? 12,
                        opacity: object.style.opacity ?? 1,
                        transform: `rotate(${object.position.rotation ?? 0}deg)`
                      }}
                      onClick={(event) => {
                        event.stopPropagation();
                        selectObject(object.id);
                      }}
                      onPointerDown={(event) => beginDrag(event, object.id, object.position.x, object.position.y)}
                    >
                      {object.kind === 'image' && object.assetId ? (
                        <img
                          className="stage-object__image"
                          src={useAuthoringStore.getState().project.assets.find((asset) => asset.id === object.assetId)?.source}
                          alt={object.name}
                        />
                      ) : (
                        <>
                          <strong>{object.text || object.name}</strong>
                          {kindLabel[object.kind] ? <small>{kindLabel[object.kind]}</small> : null}
                        </>
                      )}
                    </div>
                  );
                })}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};