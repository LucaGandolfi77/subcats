import type {
  ProjectDocument,
  Slide,
  SlideObject,
  Trigger,
  TriggerAction,
  TriggerEvent
} from '@courseweaver/domain';

import { evaluateConditions } from './conditions';
import { gradeQuizQuestion } from './quizEngine';
import {
  createRuntimeSession,
  getCurrentSlide,
  getObjectOnCurrentSlide,
  getOrderedTriggers,
  type RuntimeSession,
  type TriggerDispatchContext
} from './runtimeSession';

const appendUnique = (values: string[], nextValue: string) => (values.includes(nextValue) ? values : [...values, nextValue]);

const removeValue = (values: string[], nextValue: string) => values.filter((value) => value !== nextValue);

const recordEvent = (session: RuntimeSession, triggerId: string): RuntimeSession => ({
  ...session,
  eventLog: [...session.eventLog, { triggerId, at: new Date().toISOString() }]
});

const runVariableTriggers = (
  project: ProjectDocument,
  session: RuntimeSession,
  variableId: string
): RuntimeSession => dispatchEvent(project, session, 'onVariableChange', { changedVariableId: variableId });

const applyAction = (
  project: ProjectDocument,
  slide: Slide,
  session: RuntimeSession,
  action: TriggerAction,
  context: TriggerDispatchContext
): RuntimeSession => {
  switch (action.type) {
    case 'showLayer': {
      if (!action.targetId) {
        return session;
      }

      const visible = session.visibleLayerIds[slide.id] ?? [];
      return {
        ...session,
        visibleLayerIds: {
          ...session.visibleLayerIds,
          [slide.id]: appendUnique(visible, action.targetId)
        }
      };
    }
    case 'hideLayer': {
      if (!action.targetId) {
        return session;
      }

      return {
        ...session,
        visibleLayerIds: {
          ...session.visibleLayerIds,
          [slide.id]: removeValue(session.visibleLayerIds[slide.id] ?? [], action.targetId)
        }
      };
    }
    case 'toggleLayer': {
      if (!action.targetId) {
        return session;
      }

      const visible = session.visibleLayerIds[slide.id] ?? [];
      const isVisible = visible.includes(action.targetId);
      return {
        ...session,
        visibleLayerIds: {
          ...session.visibleLayerIds,
          [slide.id]: isVisible ? removeValue(visible, action.targetId) : appendUnique(visible, action.targetId)
        }
      };
    }
    case 'jumpToSlide': {
      if (!action.targetId) {
        return session;
      }

      return {
        ...session,
        currentSlideId: action.targetId,
        visitedSlideIds: appendUnique(session.visitedSlideIds, action.targetId)
      };
    }
    case 'setVariable': {
      if (!action.variableId || action.value === undefined) {
        return session;
      }

      const updated = {
        ...session,
        variables: {
          ...session.variables,
          [action.variableId]: action.value
        }
      };
      return runVariableTriggers(project, updated, action.variableId);
    }
    case 'changeState': {
      if (!action.targetId || !action.stateId) {
        return session;
      }

      return {
        ...session,
        objectStates: {
          ...session.objectStates,
          [action.targetId]: action.stateId
        }
      };
    }
    case 'playMedia': {
      if (!action.mediaAssetId) {
        return session;
      }

      return {
        ...session,
        mediaQueue: [...session.mediaQueue, action.mediaAssetId]
      };
    }
    case 'submitQuiz': {
      if (!action.targetId || !context.quizSelections) {
        return session;
      }

      const object = slide.objects.find((candidate) => candidate.id === action.targetId);
      const question = object?.interaction?.quiz;
      if (!question) {
        return session;
      }

      const result = gradeQuizQuestion(question, context.quizSelections);
      return {
        ...session,
        quizResults: {
          ...session.quizResults,
          [question.id]: result
        }
      };
    }
    default:
      return session;
  }
};

const executeTrigger = (
  project: ProjectDocument,
  slide: Slide,
  session: RuntimeSession,
  trigger: Trigger,
  context: TriggerDispatchContext
): RuntimeSession => {
  if (!evaluateConditions(trigger.conditions, session.variables)) {
    return session;
  }

  const nextSession = trigger.actions.reduce(
    (currentSession, action) => applyAction(project, slide, currentSession, action, context),
    session
  );

  return recordEvent(nextSession, trigger.id);
};

export const dispatchEvent = (
  project: ProjectDocument,
  session: RuntimeSession,
  event: TriggerEvent,
  context: TriggerDispatchContext = {}
): RuntimeSession => {
  const slide = getCurrentSlide(project, session);
  const triggers = getOrderedTriggers(slide, event, context);
  return triggers.reduce(
    (currentSession, trigger) => executeTrigger(project, slide, currentSession, trigger, context),
    session
  );
};

export const clickObject = (
  project: ProjectDocument,
  session: RuntimeSession,
  objectId: string
): RuntimeSession => dispatchEvent(project, session, 'onClick', { sourceObjectId: objectId });

export const submitQuizObject = (
  project: ProjectDocument,
  session: RuntimeSession,
  objectId: string,
  selectedOptionIds: string[]
): RuntimeSession => {
  const slide = getCurrentSlide(project, session);
  const object = getObjectOnCurrentSlide(project, session, objectId);

  if (!object?.interaction?.quiz) {
    return session;
  }

  const baseResult = gradeQuizQuestion(object.interaction.quiz, selectedOptionIds);
  const withBaseResult = {
    ...session,
    quizResults: {
      ...session.quizResults,
      [baseResult.questionId]: baseResult
    }
  };

  const matchingTriggers = [
    ...slide.triggers,
    ...object.triggers
  ].filter((trigger) => trigger.event === 'onQuizSubmit' && (!trigger.sourceObjectId || trigger.sourceObjectId === objectId));

  return matchingTriggers
    .sort((left, right) => left.order - right.order)
    .reduce(
      (currentSession, trigger) => executeTrigger(project, slide, currentSession, trigger, { sourceObjectId: objectId, quizSelections: selectedOptionIds }),
      withBaseResult
    );
};

export const createRuntime = (project: ProjectDocument) => ({
  session: createRuntimeSession(project)
});

export const setVariableValue = (
  project: ProjectDocument,
  session: RuntimeSession,
  variableId: string,
  value: string | number | boolean
) => runVariableTriggers(
  project,
  {
    ...session,
    variables: {
      ...session.variables,
      [variableId]: value
    }
  },
  variableId
);

export const navigateToSlide = (
  session: RuntimeSession,
  slideId: string
) => ({
  ...session,
  currentSlideId: slideId,
  visitedSlideIds: appendUnique(session.visitedSlideIds, slideId)
});

export type { RuntimeSession } from './runtimeSession';