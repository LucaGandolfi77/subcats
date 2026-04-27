import { z } from 'zod';

export const PROJECT_VERSION = '1.0.0';

export type Identifier = string;

export const variableKinds = ['text', 'number', 'boolean'] as const;
export const objectKinds = [
  'text',
  'shape',
  'button',
  'image',
  'hotspot',
  'tabs',
  'accordion',
  'slider',
  'marker',
  'dragDrop',
  'branchingScenario',
  'quiz',
  'caption'
] as const;
export const triggerEvents = ['onClick', 'onEnter', 'onTimelineStart', 'onVariableChange', 'onQuizSubmit'] as const;
export const triggerActionTypes = [
  'showLayer',
  'hideLayer',
  'toggleLayer',
  'jumpToSlide',
  'setVariable',
  'changeState',
  'playMedia',
  'submitQuiz'
] as const;
export const comparisonOperators = ['equals', 'notEquals', 'greaterThan', 'lessThan', 'contains', 'isTrue', 'isFalse'] as const;
export const mediaKinds = ['image', 'audio', 'video', 'caption', 'transcript'] as const;
export const scormVersions = ['1.2'] as const;
export const scormTimeLimitActions = ['exit,message', 'exit,no message', 'continue,message', 'continue,no message'] as const;
export const scormCreditModes = ['credit', 'no-credit'] as const;
export const scormLessonModes = ['normal', 'browse', 'review'] as const;

export type VariableKind = (typeof variableKinds)[number];
export type ObjectKind = (typeof objectKinds)[number];
export type TriggerEvent = (typeof triggerEvents)[number];
export type TriggerActionType = (typeof triggerActionTypes)[number];
export type ComparisonOperator = (typeof comparisonOperators)[number];
export type MediaKind = (typeof mediaKinds)[number];
export type ScormVersion = (typeof scormVersions)[number];
export type ScormTimeLimitAction = (typeof scormTimeLimitActions)[number];
export type ScormCreditMode = (typeof scormCreditModes)[number];
export type ScormLessonMode = (typeof scormLessonModes)[number];

export type ScalarValue = string | number | boolean;

export interface Position {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
}

export interface ObjectStyle {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  textColor?: string;
  fontSize?: number;
  fontWeight?: number;
  borderRadius?: number;
  opacity?: number;
  padding?: number;
  backgroundImageFit?: 'cover' | 'contain' | 'stretch';
}

export interface Condition {
  id: Identifier;
  variableId: Identifier;
  operator: ComparisonOperator;
  value?: ScalarValue;
}

export interface TriggerAction {
  id: Identifier;
  type: TriggerActionType;
  targetId?: Identifier;
  variableId?: Identifier;
  value?: ScalarValue;
  stateId?: Identifier;
  mediaAssetId?: Identifier;
}

export interface Trigger {
  id: Identifier;
  name: string;
  event: TriggerEvent;
  order: number;
  sourceObjectId?: Identifier;
  watchVariableId?: Identifier;
  conditions: Condition[];
  actions: TriggerAction[];
}

export interface VariableDefinition {
  id: Identifier;
  name: string;
  kind: VariableKind;
  defaultValue: ScalarValue;
}

export interface ObjectState {
  id: Identifier;
  name: string;
  style?: ObjectStyle;
  text?: string;
  visibility?: boolean;
}

export interface MediaAsset {
  id: Identifier;
  name: string;
  kind: MediaKind;
  source: string;
  mimeType?: string;
  transcript?: string;
  captions?: Array<{ startMs: number; endMs: number; text: string }>;
}

export interface TabsInteraction {
  tabs: Array<{ id: Identifier; title: string; body: string }>;
}

export interface AccordionInteraction {
  items: Array<{ id: Identifier; title: string; body: string }>;
}

export interface SliderInteraction {
  min: number;
  max: number;
  step: number;
  variableId?: Identifier;
}

export interface MarkerInteraction {
  label: string;
  body: string;
}

export interface DragDropInteraction {
  prompt: string;
  pairs: Array<{ dragId: Identifier; dropId: Identifier; correct: boolean }>;
}

export interface BranchingOption {
  id: Identifier;
  label: string;
  goToSlideId?: Identifier;
  setVariable?: { variableId: Identifier; value: ScalarValue };
}

export interface BranchingScenarioInteraction {
  prompt: string;
  options: BranchingOption[];
}

export interface QuizChoice {
  id: Identifier;
  label: string;
}

export interface QuizQuestion {
  id: Identifier;
  prompt: string;
  type: 'multipleChoice';
  options: QuizChoice[];
  correctOptionIds: Identifier[];
  points: number;
  feedbackCorrect?: string;
  feedbackIncorrect?: string;
}

export interface QuizResult {
  questionId: Identifier;
  selectedOptionIds: Identifier[];
  awardedPoints: number;
  maxPoints: number;
  isCorrect: boolean;
}

export interface InteractionConfig {
  tabs?: TabsInteraction;
  accordion?: AccordionInteraction;
  slider?: SliderInteraction;
  marker?: MarkerInteraction;
  dragDrop?: DragDropInteraction;
  branchingScenario?: BranchingScenarioInteraction;
  quiz?: QuizQuestion;
}

export interface SlideObject {
  id: Identifier;
  name: string;
  kind: ObjectKind;
  layerId: Identifier;
  position: Position;
  visible: boolean;
  text?: string;
  assetId?: Identifier;
  style: ObjectStyle;
  defaultStateId?: Identifier;
  states: ObjectState[];
  triggers: Trigger[];
  interaction?: InteractionConfig;
}

export interface Layer {
  id: Identifier;
  name: string;
  visibleByDefault: boolean;
  locked: boolean;
  objectIds: Identifier[];
}

export interface Slide {
  id: Identifier;
  sceneId: Identifier;
  title: string;
  notes: string;
  background?: string;
  layers: Layer[];
  objects: SlideObject[];
  triggers: Trigger[];
}

export interface Scene {
  id: Identifier;
  title: string;
  slideIds: Identifier[];
}

export interface Theme {
  fonts: {
    heading: string;
    body: string;
  };
  colors: {
    canvas: string;
    accent: string;
    accentMuted: string;
    panel: string;
    text: string;
  };
}

export interface CourseMetadata {
  slug: string;
  language: string;
  provider: string;
  subject: string;
  durationMinutes?: number;
  keywords: string[];
}

export interface ScormSettings {
  version: ScormVersion;
  packageIdentifier: string;
  organizationTitle: string;
  itemTitle: string;
  masteryScore: number;
  maxTimeAllowed?: string;
  timeLimitAction: ScormTimeLimitAction;
  credit: ScormCreditMode;
  lessonMode: ScormLessonMode;
  dataFromLms?: string;
}

export interface PublishingSettings {
  scorm: ScormSettings;
}

export interface PlayerSettings {
  width: number;
  height: number;
  responsiveMode: 'contain' | 'cover' | 'scroll';
  allowCaptions: boolean;
  showTranscriptPanel: boolean;
  startSceneId?: Identifier;
  startSlideId?: Identifier;
}

export interface ExportJob {
  id: Identifier;
  target: 'web' | 'scorm' | 'xapi';
  createdAt: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  outputLocation?: string;
}

export interface ProjectDocument {
  version: string;
  id: Identifier;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  scenes: Scene[];
  slides: Slide[];
  variables: VariableDefinition[];
  assets: MediaAsset[];
  courseMetadata: CourseMetadata;
  theme: Theme;
  publishing: PublishingSettings;
  playerSettings: PlayerSettings;
  exportJobs: ExportJob[];
}

export const defaultTheme: Theme = {
  fonts: {
    heading: 'IBM Plex Sans',
    body: 'IBM Plex Sans'
  },
  colors: {
    canvas: '#f3efe3',
    accent: '#0b7a75',
    accentMuted: '#d8ebe8',
    panel: '#10211c',
    text: '#18211f'
  }
};

const now = () => new Date().toISOString();

const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'course';

const toScormIdentifier = (value: string) => `cw.${slugify(value).replace(/-/g, '_')}`;

export const createId = () => globalThis.crypto?.randomUUID?.() ?? `cw-${Math.random().toString(36).slice(2, 10)}`;

export const createCourseMetadata = (title = 'Untitled Learning Project'): CourseMetadata => ({
  slug: slugify(title),
  language: 'en',
  provider: 'CourseWeaver Studio',
  subject: 'Interactive E-Learning',
  durationMinutes: 10,
  keywords: []
});

export const createPublishingSettings = (title = 'Untitled Learning Project'): PublishingSettings => ({
  scorm: {
    version: '1.2',
    packageIdentifier: toScormIdentifier(title),
    organizationTitle: title,
    itemTitle: title,
    masteryScore: 80,
    timeLimitAction: 'continue,no message',
    credit: 'credit',
    lessonMode: 'normal'
  }
});

export const createLayer = (name = 'Base Layer'): Layer => ({
  id: createId(),
  name,
  visibleByDefault: true,
  locked: false,
  objectIds: []
});

export const createScene = (title = 'New Scene'): Scene => ({
  id: createId(),
  title,
  slideIds: []
});

export const createSlide = (sceneId: Identifier, title = 'New Slide'): Slide => ({
  id: createId(),
  sceneId,
  title,
  notes: '',
  background: '',
  layers: [createLayer()],
  objects: [],
  triggers: []
});

export const createVariable = (
  name = 'flag_complete',
  kind: VariableKind = 'boolean',
  defaultValue: ScalarValue = false
): VariableDefinition => ({
  id: createId(),
  name,
  kind,
  defaultValue
});

export const createSlideObject = (kind: ObjectKind, layerId: Identifier): SlideObject => {
  const defaults: Record<ObjectKind, Partial<SlideObject>> = {
    text: {
      name: 'Text',
      text: 'Editable text',
      style: { textColor: '#18211f', fontSize: 28, fontWeight: 500, padding: 8 }
    },
    shape: {
      name: 'Shape',
      style: { fill: '#d8ebe8', stroke: '#0b7a75', strokeWidth: 2, borderRadius: 20 }
    },
    button: {
      name: 'Button',
      text: 'Continue',
      style: { fill: '#0b7a75', textColor: '#f7fbfa', fontSize: 18, fontWeight: 600, borderRadius: 999, padding: 12 }
    },
    image: {
      name: 'Image',
      style: { backgroundImageFit: 'cover', borderRadius: 18 }
    },
    hotspot: {
      name: 'Hotspot',
      style: { fill: 'rgba(11, 122, 117, 0.08)', stroke: '#0b7a75', strokeWidth: 2, borderRadius: 16 }
    },
    tabs: {
      name: 'Tabs',
      style: { fill: '#ffffff', textColor: '#18211f', borderRadius: 20 },
      interaction: {
        tabs: {
          tabs: [
            { id: createId(), title: 'Overview', body: 'Describe the first idea here.' },
            { id: createId(), title: 'Practice', body: 'Describe the practice activity here.' }
          ]
        }
      }
    },
    accordion: {
      name: 'Accordion',
      style: { fill: '#ffffff', textColor: '#18211f', borderRadius: 20 },
      interaction: {
        accordion: {
          items: [
            { id: createId(), title: 'Step 1', body: 'Explain the first step.' },
            { id: createId(), title: 'Step 2', body: 'Explain the second step.' }
          ]
        }
      }
    },
    slider: {
      name: 'Slider',
      style: { fill: '#ffffff', textColor: '#18211f', borderRadius: 20 },
      interaction: { slider: { min: 0, max: 100, step: 10 } }
    },
    marker: {
      name: 'Marker',
      style: { fill: '#0b7a75', textColor: '#f7fbfa', borderRadius: 999 },
      interaction: { marker: { label: '1', body: 'Marker detail' } }
    },
    dragDrop: {
      name: 'Drag & Drop',
      style: { fill: '#ffffff', textColor: '#18211f', borderRadius: 20 },
      interaction: { dragDrop: { prompt: 'Match each item', pairs: [] } }
    },
    branchingScenario: {
      name: 'Branching Scenario',
      style: { fill: '#ffffff', textColor: '#18211f', borderRadius: 20 },
      interaction: {
        branchingScenario: {
          prompt: 'Choose the next response.',
          options: [
            { id: createId(), label: 'Option A' },
            { id: createId(), label: 'Option B' }
          ]
        }
      }
    },
    quiz: {
      name: 'Quiz',
      style: { fill: '#ffffff', textColor: '#18211f', borderRadius: 20, padding: 18 },
      interaction: {
        quiz: {
          id: createId(),
          prompt: 'Which action completes the task?',
          type: 'multipleChoice',
          options: [
            { id: createId(), label: 'First option' },
            { id: createId(), label: 'Second option' },
            { id: createId(), label: 'Third option' }
          ],
          correctOptionIds: [],
          points: 10,
          feedbackCorrect: 'Correct.',
          feedbackIncorrect: 'Try again.'
        }
      }
    },
    caption: {
      name: 'Caption',
      text: 'Caption text',
      style: { fill: '#10211c', textColor: '#f7fbfa', fontSize: 14, padding: 12, borderRadius: 12 }
    }
  };

  const base = defaults[kind];
  return {
    id: createId(),
    name: base.name ?? kind,
    kind,
    layerId,
    position: {
      x: 96,
      y: 96,
      width: kind === 'text' ? 300 : 240,
      height: kind === 'text' ? 80 : 120,
      rotation: 0
    },
    visible: true,
    text: base.text,
    assetId: undefined,
    style: base.style ?? {},
    defaultStateId: undefined,
    states: [],
    triggers: [],
    interaction: base.interaction
  };
};

export const createProject = (title = 'Untitled Learning Project'): ProjectDocument => {
  const scene = createScene('Scene 1');
  const slide = createSlide(scene.id, 'Slide 1');
  scene.slideIds.push(slide.id);

  return {
    version: PROJECT_VERSION,
    id: createId(),
    title,
    description: 'Interactive course project',
    createdAt: now(),
    updatedAt: now(),
    scenes: [scene],
    slides: [slide],
    variables: [],
    assets: [],
    courseMetadata: createCourseMetadata(title),
    theme: defaultTheme,
    publishing: createPublishingSettings(title),
    playerSettings: {
      width: 1280,
      height: 720,
      responsiveMode: 'contain',
      allowCaptions: true,
      showTranscriptPanel: false,
      startSceneId: scene.id,
      startSlideId: slide.id
    },
    exportJobs: []
  };
};

export const getSlide = (project: ProjectDocument, slideId: Identifier) =>
  project.slides.find((slide) => slide.id === slideId);

export const getScene = (project: ProjectDocument, sceneId: Identifier) =>
  project.scenes.find((scene) => scene.id === sceneId);

export const getObject = (slide: Slide, objectId: Identifier) => slide.objects.find((object) => object.id === objectId);

export const zScalarValue = z.union([z.string(), z.number(), z.boolean()]);