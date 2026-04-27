import {
  getSlide,
  PROJECT_VERSION,
  type ProjectDocument,
  type QuizResult,
  type ScalarValue,
  type Slide,
  type SlideObject,
  type Trigger
} from '@courseweaver/domain';

export interface RuntimeEventLog {
  triggerId: string;
  at: string;
}

export interface RuntimeSession {
  projectVersion: string;
  projectId: string;
  currentSlideId: string;
  variables: Record<string, ScalarValue>;
  visibleLayerIds: Record<string, string[]>;
  objectStates: Record<string, string | undefined>;
  quizResults: Record<string, QuizResult>;
  mediaQueue: string[];
  visitedSlideIds: string[];
  eventLog: RuntimeEventLog[];
}

export interface TriggerDispatchContext {
  sourceObjectId?: string;
  quizSelections?: string[];
  changedVariableId?: string;
}

export const buildDefaultVariableMap = (project: ProjectDocument) =>
  Object.fromEntries(project.variables.map((variable) => [variable.id, variable.defaultValue]));

export const buildInitialLayerVisibility = (project: ProjectDocument) =>
  Object.fromEntries(
    project.slides.map((slide) => [
      slide.id,
      slide.layers.filter((layer) => layer.visibleByDefault).map((layer) => layer.id)
    ])
  );

export const buildInitialObjectStates = (project: ProjectDocument) =>
  Object.fromEntries(
    project.slides.flatMap((slide) =>
      slide.objects.map((object) => [object.id, object.defaultStateId])
    )
  );

export const createRuntimeSession = (project: ProjectDocument): RuntimeSession => ({
  projectVersion: PROJECT_VERSION,
  projectId: project.id,
  currentSlideId: project.playerSettings.startSlideId ?? project.scenes[0].slideIds[0],
  variables: buildDefaultVariableMap(project),
  visibleLayerIds: buildInitialLayerVisibility(project),
  objectStates: buildInitialObjectStates(project),
  quizResults: {},
  mediaQueue: [],
  visitedSlideIds: [project.playerSettings.startSlideId ?? project.scenes[0].slideIds[0]],
  eventLog: []
});

export const getCurrentSlide = (project: ProjectDocument, session: RuntimeSession): Slide => {
  const slide = getSlide(project, session.currentSlideId);
  if (!slide) {
    throw new Error(`Unknown slide ${session.currentSlideId}`);
  }
  return slide;
};

export const getObjectOnCurrentSlide = (
  project: ProjectDocument,
  session: RuntimeSession,
  objectId: string
): SlideObject | undefined => getCurrentSlide(project, session).objects.find((object) => object.id === objectId);

export const getOrderedTriggers = (
  slide: Slide,
  event: Trigger['event'],
  context: TriggerDispatchContext
) => {
  const allTriggers = [
    ...slide.triggers,
    ...slide.objects.flatMap((object) => object.triggers)
  ];

  return allTriggers
    .filter((trigger) => {
      if (trigger.event !== event) {
        return false;
      }

      if (event === 'onClick' && trigger.sourceObjectId && context.sourceObjectId !== trigger.sourceObjectId) {
        return false;
      }

      if (event === 'onVariableChange' && trigger.watchVariableId && trigger.watchVariableId !== context.changedVariableId) {
        return false;
      }

      return true;
    })
    .sort((left, right) => left.order - right.order);
};