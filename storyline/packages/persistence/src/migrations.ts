import { createCourseMetadata, createProject, createPublishingSettings, projectSchema, type ProjectDocument } from '@courseweaver/domain';

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

const mergeCourseMetadata = (value: unknown, title: string) => {
  const defaults = createCourseMetadata(title);

  if (!isRecord(value)) {
    return defaults;
  }

  return {
    ...defaults,
    ...(typeof value.slug === 'string' ? { slug: value.slug } : {}),
    ...(typeof value.language === 'string' ? { language: value.language } : {}),
    ...(typeof value.provider === 'string' ? { provider: value.provider } : {}),
    ...(typeof value.subject === 'string' ? { subject: value.subject } : {}),
    ...(typeof value.durationMinutes === 'number' ? { durationMinutes: value.durationMinutes } : {}),
    keywords: Array.isArray(value.keywords) ? value.keywords.filter((keyword): keyword is string => typeof keyword === 'string') : defaults.keywords
  };
};

const mergePublishingSettings = (value: unknown, title: string) => {
  const defaults = createPublishingSettings(title);
  const scormInput = isRecord(value) && isRecord(value.scorm) ? value.scorm : {};

  return {
    scorm: {
      ...defaults.scorm,
      ...(typeof scormInput.version === 'string' ? { version: scormInput.version } : {}),
      ...(typeof scormInput.packageIdentifier === 'string' ? { packageIdentifier: scormInput.packageIdentifier } : {}),
      ...(typeof scormInput.organizationTitle === 'string' ? { organizationTitle: scormInput.organizationTitle } : {}),
      ...(typeof scormInput.itemTitle === 'string' ? { itemTitle: scormInput.itemTitle } : {}),
      ...(typeof scormInput.masteryScore === 'number' ? { masteryScore: scormInput.masteryScore } : {}),
      ...(typeof scormInput.maxTimeAllowed === 'string' ? { maxTimeAllowed: scormInput.maxTimeAllowed } : {}),
      ...(typeof scormInput.timeLimitAction === 'string' ? { timeLimitAction: scormInput.timeLimitAction } : {}),
      ...(typeof scormInput.credit === 'string' ? { credit: scormInput.credit } : {}),
      ...(typeof scormInput.lessonMode === 'string' ? { lessonMode: scormInput.lessonMode } : {}),
      ...(typeof scormInput.dataFromLms === 'string' ? { dataFromLms: scormInput.dataFromLms } : {})
    }
  };
};

export const migrateProjectDocument = (input: unknown): ProjectDocument => {
  if (!isRecord(input)) {
    return createProject();
  }

  const copy = structuredClone(input);
  const title = typeof copy.title === 'string' ? copy.title : 'Untitled Learning Project';
  if (!('version' in copy)) {
    copy.version = '1.0.0';
  }

  if (copy.version === '0.9.0' && Array.isArray(copy.slides)) {
    copy.slides = copy.slides.map((slide) => {
      if (!isRecord(slide) || !Array.isArray(slide.layers)) {
        return slide;
      }

      return {
        ...slide,
        layers: slide.layers.map((layer) => {
          if (!isRecord(layer)) {
            return layer;
          }

          const visible = typeof layer.visible === 'boolean' ? layer.visible : true;
          const { visible: _visible, ...rest } = layer;
          return {
            ...rest,
            visibleByDefault: visible,
            locked: typeof layer.locked === 'boolean' ? layer.locked : false,
            objectIds: Array.isArray(layer.objectIds) ? layer.objectIds : []
          };
        })
      };
    });
    copy.version = '1.0.0';
  }

  copy.courseMetadata = mergeCourseMetadata(copy.courseMetadata, title);
  copy.publishing = mergePublishingSettings(copy.publishing, title);

  return projectSchema.parse(copy);
};