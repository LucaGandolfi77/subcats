import {
  createId,
  createLayer,
  createProject,
  createScene,
  createSlide,
  createSlideObject,
  createVariable,
  createDemoProject,
  type Condition,
  type MediaAsset,
  type ObjectKind,
  type ObjectState,
  type ProjectDocument,
  type ScalarValue,
  type Slide,
  type SlideObject,
  type Trigger,
  type TriggerAction,
  type VariableDefinition
} from '@courseweaver/domain';
import { create } from 'zustand';

interface AuthoringState {
  project: ProjectDocument;
  activeSceneId: string;
  activeSlideId: string;
  selectedObjectId?: string;
  selectedLayerId?: string;
}

interface AuthoringActions {
  hydrateProject: (project: ProjectDocument) => void;
  createBlankProject: () => void;
  setActiveSlide: (slideId: string) => void;
  selectObject: (objectId?: string) => void;
  setSelectedLayer: (layerId?: string) => void;
  updateProject: (recipe: (project: ProjectDocument) => void) => void;
  updateScene: (sceneId: string, recipe: (scene: ProjectDocument['scenes'][number]) => void) => void;
  updateActiveSlide: (recipe: (slide: Slide) => void) => void;
  addScene: () => void;
  addSlide: () => void;
  addLayer: () => void;
  updateLayer: (layerId: string, recipe: (layer: Slide['layers'][number]) => void) => void;
  addObject: (kind: ObjectKind) => void;
  moveObject: (objectId: string, x: number, y: number) => void;
  updateObject: (objectId: string, recipe: (object: SlideObject) => void) => void;
  addStateToObject: (objectId: string) => void;
  updateObjectState: (objectId: string, stateId: string, recipe: (state: ObjectState) => void) => void;
  setDefaultState: (objectId: string, stateId?: string) => void;
  addTriggerToObject: (objectId: string) => void;
  updateTrigger: (objectId: string, triggerId: string, recipe: (trigger: Trigger) => void) => void;
  addTriggerAction: (objectId: string, triggerId: string) => void;
  updateTriggerAction: (objectId: string, triggerId: string, actionId: string, recipe: (action: TriggerAction) => void) => void;
  addTriggerCondition: (objectId: string, triggerId: string) => void;
  updateTriggerCondition: (objectId: string, triggerId: string, conditionId: string, recipe: (condition: Condition) => void) => void;
  addVariable: () => void;
  updateVariable: (variableId: string, recipe: (variable: VariableDefinition) => void) => void;
  addAsset: (asset: MediaAsset) => void;
}

export type AuthoringStore = AuthoringState & AuthoringActions;

const getSceneForSlide = (project: ProjectDocument, slideId: string) =>
  project.scenes.find((scene) => scene.slideIds.includes(slideId));

const getActiveSlide = (project: ProjectDocument, activeSlideId: string) => {
  const slide = project.slides.find((entry) => entry.id === activeSlideId);
  if (!slide) {
    throw new Error(`Active slide not found: ${activeSlideId}`);
  }
  return slide;
};

const findObject = (slide: Slide, objectId: string) => {
  const object = slide.objects.find((entry) => entry.id === objectId);
  if (!object) {
    throw new Error(`Object not found: ${objectId}`);
  }
  return object;
};

const touchProject = (project: ProjectDocument) => {
  project.updatedAt = new Date().toISOString();
};

const initializeSelection = (project: ProjectDocument) => {
  const activeSlideId = project.playerSettings.startSlideId ?? project.scenes[0]?.slideIds[0] ?? project.slides[0]?.id;
  const activeSceneId = getSceneForSlide(project, activeSlideId)?.id ?? project.scenes[0]?.id;
  const selectedLayerId = activeSlideId ? getActiveSlide(project, activeSlideId).layers[0]?.id : undefined;
  return {
    activeSceneId,
    activeSlideId,
    selectedLayerId,
    selectedObjectId: undefined
  };
};

const mutateProject = (
  state: AuthoringState,
  recipe: (project: ProjectDocument) => void,
  extra?: Partial<AuthoringState>
): Partial<AuthoringState> => {
  const project = structuredClone(state.project) as ProjectDocument;
  recipe(project);
  touchProject(project);
  return {
    project,
    ...extra
  };
};

const initialProject = createDemoProject();

export const useAuthoringStore = create<AuthoringStore>((set, get) => ({
  project: initialProject,
  ...initializeSelection(initialProject),

  hydrateProject: (project) => set({ project, ...initializeSelection(project) }),

  createBlankProject: () => {
    const project = createProject('Untitled Learning Project');
    set({ project, ...initializeSelection(project) });
  },

  setActiveSlide: (slideId) =>
    set((state) => {
      const slide = state.project.slides.find((entry) => entry.id === slideId);
      if (!slide) {
        return state;
      }
      const scene = getSceneForSlide(state.project, slideId);
      return {
        activeSlideId: slideId,
        activeSceneId: scene?.id ?? state.activeSceneId,
        selectedLayerId: slide.layers[0]?.id,
        selectedObjectId: undefined
      };
    }),

  selectObject: (objectId) => set({ selectedObjectId: objectId }),

  setSelectedLayer: (layerId) => set({ selectedLayerId: layerId }),

  updateProject: (recipe) => set((state) => mutateProject(state, recipe)),

  updateScene: (sceneId, recipe) =>
    set((state) =>
      mutateProject(state, (project) => {
        const scene = project.scenes.find((entry) => entry.id === sceneId);
        if (scene) {
          recipe(scene);
        }
      })
    ),

  updateActiveSlide: (recipe) =>
    set((state) =>
      mutateProject(state, (project) => {
        recipe(getActiveSlide(project, state.activeSlideId));
      })
    ),

  addScene: () =>
    set((state) => {
      const scene = createScene(`Scene ${state.project.scenes.length + 1}`);
      const slide = createSlide(scene.id, 'Slide 1');
      scene.slideIds.push(slide.id);
      return mutateProject(
        state,
        (project) => {
          project.scenes.push(scene);
          project.slides.push(slide);
        },
        {
          activeSceneId: scene.id,
          activeSlideId: slide.id,
          selectedLayerId: slide.layers[0]?.id,
          selectedObjectId: undefined
        }
      );
    }),

  addSlide: () =>
    set((state) => {
      const slide = createSlide(state.activeSceneId, `Slide ${state.project.scenes.find((scene) => scene.id === state.activeSceneId)?.slideIds.length ?? 0 + 1}`);
      return mutateProject(
        state,
        (project) => {
          project.slides.push(slide);
          const scene = project.scenes.find((entry) => entry.id === state.activeSceneId);
          scene?.slideIds.push(slide.id);
        },
        {
          activeSlideId: slide.id,
          selectedLayerId: slide.layers[0]?.id,
          selectedObjectId: undefined
        }
      );
    }),

  addLayer: () =>
    set((state) => {
      const slide = getActiveSlide(state.project, state.activeSlideId);
      const layer = createLayer(`Layer ${slide.layers.length + 1}`);
      return mutateProject(
        state,
        (project) => {
          getActiveSlide(project, state.activeSlideId).layers.push(layer);
        },
        { selectedLayerId: layer.id }
      );
    }),

  updateLayer: (layerId, recipe) =>
    set((state) =>
      mutateProject(state, (project) => {
        const layer = getActiveSlide(project, state.activeSlideId).layers.find((entry) => entry.id === layerId);
        if (layer) {
          recipe(layer);
        }
      })
    ),

  addObject: (kind) =>
    set((state) => {
      const layerId = state.selectedLayerId ?? getActiveSlide(state.project, state.activeSlideId).layers[0]?.id;
      if (!layerId) {
        return state;
      }
      const object = createSlideObject(kind, layerId);
      if (kind === 'quiz' && object.interaction?.quiz && object.interaction.quiz.correctOptionIds.length === 0) {
        object.interaction.quiz.correctOptionIds = [object.interaction.quiz.options[0].id];
      }
      return mutateProject(
        state,
        (project) => {
          const slide = getActiveSlide(project, state.activeSlideId);
          slide.objects.push(object);
          slide.layers.find((entry) => entry.id === layerId)?.objectIds.push(object.id);
        },
        { selectedObjectId: object.id }
      );
    }),

  moveObject: (objectId, x, y) =>
    set((state) =>
      mutateProject(state, (project) => {
        const object = findObject(getActiveSlide(project, state.activeSlideId), objectId);
        object.position.x = Math.max(0, Math.round(x));
        object.position.y = Math.max(0, Math.round(y));
      })
    ),

  updateObject: (objectId, recipe) =>
    set((state) =>
      mutateProject(state, (project) => {
        recipe(findObject(getActiveSlide(project, state.activeSlideId), objectId));
      })
    ),

  addStateToObject: (objectId) =>
    set((state) =>
      mutateProject(state, (project) => {
        const object = findObject(getActiveSlide(project, state.activeSlideId), objectId);
        const stateId = createId();
        object.states.push({
          id: stateId,
          name: `State ${object.states.length + 1}`,
          text: object.text,
          style: { ...object.style },
          visibility: object.visible
        });
        object.defaultStateId ||= stateId;
      })
    ),

  updateObjectState: (objectId, stateId, recipe) =>
    set((state) =>
      mutateProject(state, (project) => {
        const objectState = findObject(getActiveSlide(project, state.activeSlideId), objectId).states.find((entry) => entry.id === stateId);
        if (objectState) {
          recipe(objectState);
        }
      })
    ),

  setDefaultState: (objectId, stateId) =>
    set((state) =>
      mutateProject(state, (project) => {
        findObject(getActiveSlide(project, state.activeSlideId), objectId).defaultStateId = stateId;
      })
    ),

  addTriggerToObject: (objectId) =>
    set((state) =>
      mutateProject(state, (project) => {
        const slide = getActiveSlide(project, state.activeSlideId);
        const object = findObject(slide, objectId);
        object.triggers.push({
          id: createId(),
          name: `Trigger ${object.triggers.length + 1}`,
          event: 'onClick',
          order: object.triggers.length + 1,
          sourceObjectId: objectId,
          conditions: [],
          actions: [{ id: createId(), type: 'showLayer', targetId: slide.layers.find((layer) => !layer.visibleByDefault)?.id ?? slide.layers[0]?.id }]
        });
      })
    ),

  updateTrigger: (objectId, triggerId, recipe) =>
    set((state) =>
      mutateProject(state, (project) => {
        const trigger = findObject(getActiveSlide(project, state.activeSlideId), objectId).triggers.find((entry) => entry.id === triggerId);
        if (trigger) {
          recipe(trigger);
        }
      })
    ),

  addTriggerAction: (objectId, triggerId) =>
    set((state) =>
      mutateProject(state, (project) => {
        const trigger = findObject(getActiveSlide(project, state.activeSlideId), objectId).triggers.find((entry) => entry.id === triggerId);
        if (trigger) {
          trigger.actions.push({ id: createId(), type: 'setVariable' });
        }
      })
    ),

  updateTriggerAction: (objectId, triggerId, actionId, recipe) =>
    set((state) =>
      mutateProject(state, (project) => {
        const action = findObject(getActiveSlide(project, state.activeSlideId), objectId)
          .triggers.find((entry) => entry.id === triggerId)
          ?.actions.find((entry) => entry.id === actionId);
        if (action) {
          recipe(action);
        }
      })
    ),

  addTriggerCondition: (objectId, triggerId) =>
    set((state) =>
      mutateProject(state, (project) => {
        const variableId = project.variables[0]?.id ?? createVariable().id;
        const trigger = findObject(getActiveSlide(project, state.activeSlideId), objectId).triggers.find((entry) => entry.id === triggerId);
        if (trigger) {
          trigger.conditions.push({ id: createId(), variableId, operator: 'equals', value: true });
        }
      })
    ),

  updateTriggerCondition: (objectId, triggerId, conditionId, recipe) =>
    set((state) =>
      mutateProject(state, (project) => {
        const condition = findObject(getActiveSlide(project, state.activeSlideId), objectId)
          .triggers.find((entry) => entry.id === triggerId)
          ?.conditions.find((entry) => entry.id === conditionId);
        if (condition) {
          recipe(condition);
        }
      })
    ),

  addVariable: () =>
    set((state) =>
      mutateProject(state, (project) => {
        project.variables.push(createVariable(`variable_${project.variables.length + 1}`, 'boolean', false));
      })
    ),

  updateVariable: (variableId, recipe) =>
    set((state) =>
      mutateProject(state, (project) => {
        const variable = project.variables.find((entry) => entry.id === variableId);
        if (variable) {
          recipe(variable);
        }
      })
    ),

  addAsset: (asset) =>
    set((state) =>
      mutateProject(state, (project) => {
        project.assets.push(asset);
      })
    )
}));

export const selectActiveSlide = (state: AuthoringStore) => getActiveSlide(state.project, state.activeSlideId);

export const selectActiveScene = (state: AuthoringStore) =>
  state.project.scenes.find((scene) => scene.id === state.activeSceneId) ?? state.project.scenes[0];

export const selectSelectedObject = (state: AuthoringStore) =>
  state.selectedObjectId ? selectActiveSlide(state).objects.find((object) => object.id === state.selectedObjectId) : undefined;

export const inferMediaKind = (mimeType: string): MediaAsset['kind'] => {
  if (mimeType.startsWith('audio/')) {
    return 'audio';
  }
  if (mimeType.startsWith('video/')) {
    return 'video';
  }
  return 'image';
};

export const toScalarValue = (value: string, current: ScalarValue): ScalarValue => {
  if (typeof current === 'number') {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? current : parsed;
  }
  if (typeof current === 'boolean') {
    return value === 'true';
  }
  return value;
};