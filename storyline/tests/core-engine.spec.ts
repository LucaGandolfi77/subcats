import {
  createId,
  createLayer,
  createProject,
  createSlideObject,
  type Trigger
} from '@courseweaver/domain';
import { clickObject, createRuntimeSession, submitQuizObject } from '@courseweaver/engine';
import { createSnapshot, parseProject, serializeProject } from '@courseweaver/persistence';
import { describe, expect, it } from 'vitest';

describe('trigger engine', () => {
  it('shows a hidden layer and changes object state on click', () => {
    const project = createProject('Flow Test');
    const slide = project.slides[0];
    const baseLayer = slide.layers[0];
    const overlay = createLayer('Overlay');
    overlay.visibleByDefault = false;
    slide.layers.push(overlay);

    const button = createSlideObject('button', baseLayer.id);
    const visitedStateId = createId();
    button.states.push({ id: visitedStateId, name: 'Visited', text: 'Visited', style: { fill: '#c5601a' } });

    const trigger: Trigger = {
      id: createId(),
      name: 'Show overlay',
      event: 'onClick',
      order: 1,
      sourceObjectId: button.id,
      conditions: [],
      actions: [
        { id: createId(), type: 'showLayer', targetId: overlay.id },
        { id: createId(), type: 'changeState', targetId: button.id, stateId: visitedStateId }
      ]
    };
    button.triggers.push(trigger);
    slide.objects.push(button);
    baseLayer.objectIds.push(button.id);

    const session = clickObject(project, createRuntimeSession(project), button.id);

    expect(session.visibleLayerIds[slide.id]).toContain(overlay.id);
    expect(session.objectStates[button.id]).toBe(visitedStateId);
  });

  it('runs variable-driven navigation after setting a variable', () => {
    const project = createProject('Variable Flow');
    const scene = project.scenes[0];
    const introSlide = project.slides[0];
    const nextSlide = {
      ...project.slides[0],
      id: createId(),
      title: 'Next',
      sceneId: scene.id,
      objects: [],
      triggers: [],
      layers: [createLayer('Base')]
    };
    nextSlide.layers[0].objectIds = [];
    project.slides.push(nextSlide);
    scene.slideIds.push(nextSlide.id);

    const flag = { id: createId(), name: 'allow_next', kind: 'boolean' as const, defaultValue: false };
    project.variables.push(flag);

    const button = createSlideObject('button', introSlide.layers[0].id);
    button.triggers.push({
      id: createId(),
      name: 'Enable flow',
      event: 'onClick',
      order: 1,
      sourceObjectId: button.id,
      conditions: [],
      actions: [{ id: createId(), type: 'setVariable', variableId: flag.id, value: true }]
    });
    introSlide.objects.push(button);
    introSlide.layers[0].objectIds.push(button.id);

    introSlide.triggers.push({
      id: createId(),
      name: 'Jump when ready',
      event: 'onVariableChange',
      order: 2,
      watchVariableId: flag.id,
      conditions: [{ id: createId(), variableId: flag.id, operator: 'isTrue' }],
      actions: [{ id: createId(), type: 'jumpToSlide', targetId: nextSlide.id }]
    });

    const session = clickObject(project, createRuntimeSession(project), button.id);
    expect(session.variables[flag.id]).toBe(true);
    expect(session.currentSlideId).toBe(nextSlide.id);
  });
});

describe('quiz and persistence', () => {
  it('scores a multiple choice question', () => {
    const project = createProject('Quiz Test');
    const slide = project.slides[0];
    const quiz = createSlideObject('quiz', slide.layers[0].id);
    const question = quiz.interaction?.quiz;

    if (!question) {
      throw new Error('Quiz template was not created');
    }

    question.options = [
      { id: 'a', label: 'A' },
      { id: 'b', label: 'B' }
    ];
    question.correctOptionIds = ['b'];
    question.points = 20;
    slide.objects.push(quiz);
    slide.layers[0].objectIds.push(quiz.id);

    const session = submitQuizObject(project, createRuntimeSession(project), quiz.id, ['b']);
    expect(session.quizResults[question.id]?.awardedPoints).toBe(20);
    expect(session.quizResults[question.id]?.isCorrect).toBe(true);
  });

  it('serializes, parses, and snapshots a project document', () => {
    const project = createProject('Persistence Test');
    const serialized = serializeProject(project);
    const parsed = parseProject(serialized);
    const snapshot = createSnapshot(parsed);

    expect(parsed.title).toBe(project.title);
    expect(parsed.courseMetadata.slug).toBe('persistence-test');
    expect(parsed.publishing.scorm.packageIdentifier).toBe('cw.persistence_test');
    expect(snapshot.document.updatedAt).not.toBe(project.updatedAt);
  });

  it('hydrates course metadata and publishing defaults during migration', () => {
    const project = createProject('Migration Defaults');
    const legacyPayload = JSON.parse(serializeProject(project)) as Record<string, unknown>;
    delete legacyPayload.courseMetadata;
    delete legacyPayload.publishing;

    const parsed = parseProject(JSON.stringify(legacyPayload));

    expect(parsed.courseMetadata.language).toBe('en');
    expect(parsed.courseMetadata.slug).toBe('migration-defaults');
    expect(parsed.publishing.scorm.organizationTitle).toBe('Migration Defaults');
    expect(parsed.publishing.scorm.timeLimitAction).toBe('continue,no message');
  });
});