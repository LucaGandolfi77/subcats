import { z } from 'zod';

import {
  comparisonOperators,
  mediaKinds,
  objectKinds,
  PROJECT_VERSION,
  scormCreditModes,
  scormLessonModes,
  scormTimeLimitActions,
  scormVersions,
  triggerActionTypes,
  triggerEvents,
  variableKinds,
  zScalarValue
} from './models';

const positionSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number().positive(),
  height: z.number().positive(),
  rotation: z.number().optional()
});

const styleSchema = z.object({
  fill: z.string().optional(),
  stroke: z.string().optional(),
  strokeWidth: z.number().optional(),
  textColor: z.string().optional(),
  fontSize: z.number().optional(),
  fontWeight: z.number().optional(),
  borderRadius: z.number().optional(),
  opacity: z.number().optional(),
  padding: z.number().optional(),
  backgroundImageFit: z.enum(['cover', 'contain', 'stretch']).optional()
});

const conditionSchema = z.object({
  id: z.string(),
  variableId: z.string(),
  operator: z.enum(comparisonOperators),
  value: zScalarValue.optional()
});

const triggerActionSchema = z.object({
  id: z.string(),
  type: z.enum(triggerActionTypes),
  targetId: z.string().optional(),
  variableId: z.string().optional(),
  value: zScalarValue.optional(),
  stateId: z.string().optional(),
  mediaAssetId: z.string().optional()
});

const triggerSchema = z.object({
  id: z.string(),
  name: z.string(),
  event: z.enum(triggerEvents),
  order: z.number(),
  sourceObjectId: z.string().optional(),
  watchVariableId: z.string().optional(),
  conditions: z.array(conditionSchema),
  actions: z.array(triggerActionSchema).min(1)
});

const objectStateSchema = z.object({
  id: z.string(),
  name: z.string(),
  style: styleSchema.optional(),
  text: z.string().optional(),
  visibility: z.boolean().optional()
});

const mediaAssetSchema = z.object({
  id: z.string(),
  name: z.string(),
  kind: z.enum(mediaKinds),
  source: z.string(),
  mimeType: z.string().optional(),
  transcript: z.string().optional(),
  captions: z
    .array(
      z.object({
        startMs: z.number(),
        endMs: z.number(),
        text: z.string()
      })
    )
    .optional()
});

const interactionSchema = z.object({
  tabs: z
    .object({
      tabs: z.array(z.object({ id: z.string(), title: z.string(), body: z.string() })).min(1)
    })
    .optional(),
  accordion: z
    .object({
      items: z.array(z.object({ id: z.string(), title: z.string(), body: z.string() })).min(1)
    })
    .optional(),
  slider: z
    .object({
      min: z.number(),
      max: z.number(),
      step: z.number().positive(),
      variableId: z.string().optional()
    })
    .optional(),
  marker: z
    .object({
      label: z.string(),
      body: z.string()
    })
    .optional(),
  dragDrop: z
    .object({
      prompt: z.string(),
      pairs: z.array(
        z.object({
          dragId: z.string(),
          dropId: z.string(),
          correct: z.boolean()
        })
      )
    })
    .optional(),
  branchingScenario: z
    .object({
      prompt: z.string(),
      options: z.array(
        z.object({
          id: z.string(),
          label: z.string(),
          goToSlideId: z.string().optional(),
          setVariable: z.object({ variableId: z.string(), value: zScalarValue }).optional()
        })
      )
    })
    .optional(),
  quiz: z
    .object({
      id: z.string(),
      prompt: z.string(),
      type: z.literal('multipleChoice'),
      options: z.array(z.object({ id: z.string(), label: z.string() })).min(2),
      correctOptionIds: z.array(z.string()).min(1),
      points: z.number().nonnegative(),
      feedbackCorrect: z.string().optional(),
      feedbackIncorrect: z.string().optional()
    })
    .optional()
});

const slideObjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  kind: z.enum(objectKinds),
  layerId: z.string(),
  position: positionSchema,
  visible: z.boolean(),
  text: z.string().optional(),
  assetId: z.string().optional(),
  style: styleSchema,
  defaultStateId: z.string().optional(),
  states: z.array(objectStateSchema),
  triggers: z.array(triggerSchema),
  interaction: interactionSchema.optional()
});

const layerSchema = z.object({
  id: z.string(),
  name: z.string(),
  visibleByDefault: z.boolean(),
  locked: z.boolean(),
  objectIds: z.array(z.string())
});

const slideSchema = z.object({
  id: z.string(),
  sceneId: z.string(),
  title: z.string(),
  notes: z.string(),
  background: z.string().optional(),
  layers: z.array(layerSchema).min(1),
  objects: z.array(slideObjectSchema),
  triggers: z.array(triggerSchema)
});

const sceneSchema = z.object({
  id: z.string(),
  title: z.string(),
  slideIds: z.array(z.string())
});

const variableSchema = z.object({
  id: z.string(),
  name: z.string(),
  kind: z.enum(variableKinds),
  defaultValue: zScalarValue
});

const themeSchema = z.object({
  fonts: z.object({
    heading: z.string(),
    body: z.string()
  }),
  colors: z.object({
    canvas: z.string(),
    accent: z.string(),
    accentMuted: z.string(),
    panel: z.string(),
    text: z.string()
  })
});

const courseMetadataSchema = z.object({
  slug: z.string(),
  language: z.string(),
  provider: z.string(),
  subject: z.string(),
  durationMinutes: z.number().positive().optional(),
  keywords: z.array(z.string())
});

const scormSettingsSchema = z.object({
  version: z.enum(scormVersions),
  packageIdentifier: z.string(),
  organizationTitle: z.string(),
  itemTitle: z.string(),
  masteryScore: z.number().min(0).max(100),
  maxTimeAllowed: z.string().optional(),
  timeLimitAction: z.enum(scormTimeLimitActions),
  credit: z.enum(scormCreditModes),
  lessonMode: z.enum(scormLessonModes),
  dataFromLms: z.string().optional()
});

const publishingSettingsSchema = z.object({
  scorm: scormSettingsSchema
});

const playerSettingsSchema = z.object({
  width: z.number().positive(),
  height: z.number().positive(),
  responsiveMode: z.enum(['contain', 'cover', 'scroll']),
  allowCaptions: z.boolean(),
  showTranscriptPanel: z.boolean(),
  startSceneId: z.string().optional(),
  startSlideId: z.string().optional()
});

const exportJobSchema = z.object({
  id: z.string(),
  target: z.enum(['web', 'scorm', 'xapi']),
  createdAt: z.string(),
  status: z.enum(['pending', 'running', 'completed', 'failed']),
  outputLocation: z.string().optional()
});

export const projectSchema = z.object({
  version: z.string().default(PROJECT_VERSION),
  id: z.string(),
  title: z.string(),
  description: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  scenes: z.array(sceneSchema).min(1),
  slides: z.array(slideSchema).min(1),
  variables: z.array(variableSchema),
  assets: z.array(mediaAssetSchema),
  courseMetadata: courseMetadataSchema.default({
    slug: 'course',
    language: 'en',
    provider: 'CourseWeaver Studio',
    subject: 'Interactive E-Learning',
    keywords: []
  }),
  theme: themeSchema,
  publishing: publishingSettingsSchema.default({
    scorm: {
      version: '1.2',
      packageIdentifier: 'cw.course',
      organizationTitle: 'Course',
      itemTitle: 'Course',
      masteryScore: 80,
      timeLimitAction: 'continue,no message',
      credit: 'credit',
      lessonMode: 'normal'
    }
  }),
  playerSettings: playerSettingsSchema,
  exportJobs: z.array(exportJobSchema)
});

export type ProjectSchemaInput = z.input<typeof projectSchema>;
export type ProjectSchemaOutput = z.output<typeof projectSchema>;