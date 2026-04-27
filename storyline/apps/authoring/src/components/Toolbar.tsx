import { objectKinds, type ObjectKind } from '@courseweaver/domain';

const labels: Record<ObjectKind, string> = {
  text: 'Text',
  shape: 'Shape',
  button: 'Button',
  image: 'Image',
  hotspot: 'Hotspot',
  tabs: 'Tabs',
  accordion: 'Accordion',
  slider: 'Slider',
  marker: 'Marker',
  dragDrop: 'Drag & Drop',
  branchingScenario: 'Branching',
  quiz: 'Quiz',
  caption: 'Caption'
};

interface ToolbarProps {
  onCreateNew: () => void;
  onSave: () => void;
  onLoad: () => void;
  onPreview: () => void;
  onExport: () => void;
  onAddObject: (kind: ObjectKind) => void;
}

export const Toolbar = ({ onCreateNew, onSave, onLoad, onPreview, onExport, onAddObject }: ToolbarProps) => (
  <header className="toolbar">
    <div className="toolbar__brand">
      <p className="toolbar__eyebrow">Authoring Studio</p>
      <h1>CourseWeaver</h1>
    </div>

    <div className="toolbar__actions">
      <button type="button" onClick={onCreateNew}>New</button>
      <button type="button" onClick={onSave}>Save</button>
      <button type="button" onClick={onLoad}>Load</button>
      <button type="button" onClick={onPreview}>Preview</button>
      <button type="button" onClick={onExport}>Export Project</button>
    </div>

    <div className="toolbar__inserts">
      {objectKinds.map((kind) => (
        <button key={kind} type="button" className="toolbar__insert" onClick={() => onAddObject(kind)}>
          {labels[kind]}
        </button>
      ))}
    </div>
  </header>
);