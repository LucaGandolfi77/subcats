import {
  getCurrentSlide,
  navigateToSlide,
  setVariableValue,
  clickObject,
  createRuntimeSession,
  submitQuizObject,
  type RuntimeSession
} from '@courseweaver/engine';
import type {
  MediaAsset,
  ProjectDocument,
  ScalarValue,
  SlideObject,
  TriggerAction,
  QuizQuestion
} from '@courseweaver/domain';

const STYLE_ELEMENT_ID = 'courseweaver-runtime-styles';

export interface RuntimePlayerOptions {
  mode?: 'preview' | 'standalone';
  onSessionChange?: (session: RuntimeSession) => void;
}

export interface RuntimePlayerController {
  getSession: () => RuntimeSession;
  setProject: (project: ProjectDocument) => void;
  dispose: () => void;
}

interface RuntimeUiState {
  tabsIndex: Record<string, number>;
  accordionOpen: Record<string, string | undefined>;
  markerOpen: Record<string, boolean>;
  dragDropMatches: Record<string, Record<string, string>>;
}

const runtimeStyles = `
  .cw-player {
    display: grid;
    gap: 16px;
    width: 100%;
    color: #18211f;
    font-family: 'IBM Plex Sans', 'Segoe UI', sans-serif;
  }

  .cw-player__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    border-radius: 18px;
    background: rgba(255, 255, 255, 0.86);
    backdrop-filter: blur(18px);
    border: 1px solid rgba(16, 33, 28, 0.08);
    box-shadow: 0 20px 40px rgba(16, 33, 28, 0.08);
  }

  .cw-player__meta {
    display: grid;
    gap: 4px;
  }

  .cw-player__kicker {
    text-transform: uppercase;
    letter-spacing: 0.12em;
    font-size: 11px;
    color: #546561;
  }

  .cw-player__title {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
  }

  .cw-player__subtitle {
    margin: 0;
    color: #546561;
    font-size: 13px;
  }

  .cw-player__nav {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .cw-button,
  .cw-player button,
  .cw-player input,
  .cw-player select,
  .cw-player textarea {
    font: inherit;
  }

  .cw-button,
  .cw-player__nav button,
  .cw-object--button,
  .cw-marker__toggle,
  .cw-tabs__tab,
  .cw-accordion__toggle,
  .cw-branching__option,
  .cw-quiz__submit {
    border: 0;
    border-radius: 999px;
    background: #0b7a75;
    color: #f7fbfa;
    padding: 10px 16px;
    cursor: pointer;
    transition: transform 140ms ease, opacity 140ms ease, box-shadow 140ms ease;
    box-shadow: 0 10px 20px rgba(11, 122, 117, 0.18);
  }

  .cw-button:hover,
  .cw-player__nav button:hover,
  .cw-object--button:hover,
  .cw-marker__toggle:hover,
  .cw-tabs__tab:hover,
  .cw-accordion__toggle:hover,
  .cw-branching__option:hover,
  .cw-quiz__submit:hover {
    transform: translateY(-1px);
  }

  .cw-player__viewport {
    position: relative;
    width: 100%;
    overflow: hidden;
    border-radius: 28px;
    background:
      radial-gradient(circle at top right, rgba(11, 122, 117, 0.18), transparent 26%),
      linear-gradient(135deg, #f8f4e8 0%, #eef6f3 100%);
    border: 1px solid rgba(16, 33, 28, 0.08);
    box-shadow: 0 24px 50px rgba(16, 33, 28, 0.1);
  }

  .cw-player__stage {
    position: relative;
    margin: 0 auto;
    transform-origin: top center;
    overflow: hidden;
  }

  .cw-layer {
    position: absolute;
    inset: 0;
  }

  .cw-object {
    position: absolute;
    box-sizing: border-box;
    display: grid;
    place-items: center;
    overflow: hidden;
  }

  .cw-object--text {
    justify-items: start;
    align-items: start;
    line-height: 1.3;
    white-space: pre-wrap;
  }

  .cw-object--image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .cw-object--hotspot {
    background: rgba(11, 122, 117, 0.08);
    border: 2px dashed rgba(11, 122, 117, 0.58);
  }

  .cw-tabs,
  .cw-accordion,
  .cw-slider,
  .cw-branching,
  .cw-quiz,
  .cw-dragdrop {
    width: 100%;
    height: 100%;
    padding: 18px;
    background: rgba(255, 255, 255, 0.92);
    border-radius: inherit;
    border: 1px solid rgba(16, 33, 28, 0.08);
    display: grid;
    gap: 12px;
    align-content: start;
  }

  .cw-tabs__headers,
  .cw-branching__options {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .cw-tabs__tab[data-active='true'],
  .cw-accordion__toggle[data-active='true'] {
    background: #c5601a;
  }

  .cw-accordion__item {
    border-radius: 18px;
    overflow: hidden;
    border: 1px solid rgba(16, 33, 28, 0.08);
  }

  .cw-accordion__toggle {
    width: 100%;
    border-radius: 0;
    text-align: left;
  }

  .cw-accordion__panel {
    padding: 12px 16px 16px;
    background: #ffffff;
  }

  .cw-marker {
    position: relative;
    width: 100%;
    height: 100%;
  }

  .cw-marker__toggle {
    width: 100%;
    height: 100%;
    border-radius: 999px;
  }

  .cw-marker__panel {
    position: absolute;
    top: calc(100% + 8px);
    left: 0;
    width: 220px;
    padding: 14px;
    border-radius: 18px;
    background: rgba(16, 33, 28, 0.94);
    color: #f7fbfa;
    box-shadow: 0 18px 30px rgba(16, 33, 28, 0.24);
  }

  .cw-slider__input {
    width: 100%;
  }

  .cw-quiz__option,
  .cw-dragdrop__grid {
    display: grid;
    gap: 10px;
  }

  .cw-quiz__feedback {
    padding: 12px 14px;
    border-radius: 16px;
    background: #eef6f3;
    color: #10211c;
  }

  .cw-dragdrop__pair {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .cw-transcript {
    border-radius: 18px;
    padding: 12px 16px;
    background: rgba(255, 255, 255, 0.72);
    border: 1px solid rgba(16, 33, 28, 0.08);
  }

  .cw-caption {
    position: absolute;
    left: 24px;
    right: 24px;
    bottom: 24px;
    padding: 12px 14px;
    border-radius: 16px;
    background: rgba(16, 33, 28, 0.88);
    color: #f7fbfa;
    text-align: center;
  }

  @media (max-width: 960px) {
    .cw-player__header {
      grid-template-columns: 1fr;
      display: grid;
    }

    .cw-player__nav {
      justify-content: flex-start;
      flex-wrap: wrap;
    }
  }
`;

const injectStyles = (documentNode: Document) => {
  if (documentNode.getElementById(STYLE_ELEMENT_ID)) {
    return;
  }

  const style = documentNode.createElement('style');
  style.id = STYLE_ELEMENT_ID;
  style.textContent = runtimeStyles;
  documentNode.head.append(style);
};

const clearNode = (node: HTMLElement) => {
  while (node.firstChild) {
    node.removeChild(node.firstChild);
  }
};

const resolveAsset = (project: ProjectDocument, assetId?: string): MediaAsset | undefined =>
  project.assets.find((asset) => asset.id === assetId);

const getSlideOrder = (project: ProjectDocument) => project.scenes.flatMap((scene) => scene.slideIds);

const getActiveState = (object: SlideObject, session: RuntimeSession) =>
  object.states.find((state) => state.id === session.objectStates[object.id]);

const resolveObjectView = (object: SlideObject, session: RuntimeSession) => {
  const activeState = getActiveState(object, session);
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

const applyObjectStyle = (element: HTMLElement, object: SlideObject) => {
  element.style.left = `${object.position.x}px`;
  element.style.top = `${object.position.y}px`;
  element.style.width = `${object.position.width}px`;
  element.style.height = `${object.position.height}px`;
  element.style.transform = `rotate(${object.position.rotation ?? 0}deg)`;
  element.style.background = object.style.fill ?? 'transparent';
  element.style.color = object.style.textColor ?? '#18211f';
  element.style.fontSize = `${object.style.fontSize ?? 16}px`;
  element.style.fontWeight = `${object.style.fontWeight ?? 400}`;
  element.style.borderRadius = `${object.style.borderRadius ?? 0}px`;
  element.style.opacity = `${object.style.opacity ?? 1}`;
  element.style.padding = `${object.style.padding ?? 0}px`;
  element.style.border = object.style.stroke ? `${object.style.strokeWidth ?? 1}px solid ${object.style.stroke}` : 'none';
};

const buildRichText = (documentNode: Document, text: string) => {
  const wrapper = documentNode.createElement('div');
  wrapper.textContent = text;
  return wrapper;
};

const updateSessionAndRender = (
  state: {
    session: RuntimeSession;
    project: ProjectDocument;
    options: RuntimePlayerOptions;
  },
  nextSession: RuntimeSession,
  render: () => void
) => {
  state.session = nextSession;
  state.options.onSessionChange?.(nextSession);
  render();
};

const renderQuizObject = (
  documentNode: Document,
  object: SlideObject,
  question: QuizQuestion,
  runtimeState: { session: RuntimeSession; project: ProjectDocument; options: RuntimePlayerOptions },
  render: () => void
) => {
  const wrapper = documentNode.createElement('div');
  wrapper.className = 'cw-quiz';

  const heading = documentNode.createElement('strong');
  heading.textContent = question.prompt;
  wrapper.append(heading);

  const form = documentNode.createElement('div');
  form.className = 'cw-quiz__option';
  const inputName = `quiz-${question.id}`;

  question.options.forEach((option) => {
    const label = documentNode.createElement('label');
    label.style.display = 'flex';
    label.style.gap = '10px';
    label.style.alignItems = 'center';

    const input = documentNode.createElement('input');
    input.type = 'radio';
    input.name = inputName;
    input.value = option.id;
    label.append(input, documentNode.createTextNode(option.label));
    form.append(label);
  });

  const submit = documentNode.createElement('button');
  submit.className = 'cw-quiz__submit';
  submit.textContent = 'Submit answer';
  submit.addEventListener('click', () => {
    const selected = Array.from(form.querySelectorAll<HTMLInputElement>('input:checked')).map((input) => input.value);
    updateSessionAndRender(runtimeState, submitQuizObject(runtimeState.project, runtimeState.session, object.id, selected), render);
  });

  wrapper.append(form, submit);

  const result = runtimeState.session.quizResults[question.id];
  if (result) {
    const feedback = documentNode.createElement('div');
    feedback.className = 'cw-quiz__feedback';
    feedback.textContent = result.isCorrect ? (question.feedbackCorrect ?? 'Correct.') : (question.feedbackIncorrect ?? 'Incorrect.');
    wrapper.append(feedback);
  }

  return wrapper;
};

const renderInteractionObject = (
  documentNode: Document,
  object: SlideObject,
  uiState: RuntimeUiState,
  runtimeState: { session: RuntimeSession; project: ProjectDocument; options: RuntimePlayerOptions },
  render: () => void
) => {
  if (object.interaction?.tabs) {
    const wrapper = documentNode.createElement('div');
    wrapper.className = 'cw-tabs';

    const headerRow = documentNode.createElement('div');
    headerRow.className = 'cw-tabs__headers';
    const body = documentNode.createElement('div');
    const activeIndex = uiState.tabsIndex[object.id] ?? 0;

    object.interaction.tabs.tabs.forEach((tab, index) => {
      const button = documentNode.createElement('button');
      button.className = 'cw-tabs__tab';
      button.dataset.active = String(index === activeIndex);
      button.textContent = tab.title;
      button.addEventListener('click', () => {
        uiState.tabsIndex[object.id] = index;
        render();
      });
      headerRow.append(button);
    });

    body.textContent = object.interaction.tabs.tabs[activeIndex]?.body ?? '';
    wrapper.append(headerRow, body);
    return wrapper;
  }

  if (object.interaction?.accordion) {
    const wrapper = documentNode.createElement('div');
    wrapper.className = 'cw-accordion';

    object.interaction.accordion.items.forEach((item) => {
      const isOpen = uiState.accordionOpen[object.id] === item.id;
      const itemNode = documentNode.createElement('div');
      itemNode.className = 'cw-accordion__item';
      const toggle = documentNode.createElement('button');
      toggle.className = 'cw-accordion__toggle';
      toggle.dataset.active = String(isOpen);
      toggle.textContent = item.title;
      toggle.addEventListener('click', () => {
        uiState.accordionOpen[object.id] = isOpen ? undefined : item.id;
        render();
      });
      itemNode.append(toggle);
      if (isOpen) {
        const panel = documentNode.createElement('div');
        panel.className = 'cw-accordion__panel';
        panel.textContent = item.body;
        itemNode.append(panel);
      }
      wrapper.append(itemNode);
    });

    return wrapper;
  }

  if (object.interaction?.slider) {
    const wrapper = documentNode.createElement('div');
    wrapper.className = 'cw-slider';
    const label = documentNode.createElement('strong');
    label.textContent = object.text ?? 'Adjust value';
    const input = documentNode.createElement('input');
    input.className = 'cw-slider__input';
    input.type = 'range';
    input.min = String(object.interaction.slider.min);
    input.max = String(object.interaction.slider.max);
    input.step = String(object.interaction.slider.step);
    const value = object.interaction.slider.variableId ? runtimeState.session.variables[object.interaction.slider.variableId] : object.interaction.slider.min;
    input.value = String(typeof value === 'number' ? value : object.interaction.slider.min);
    const output = documentNode.createElement('div');
    output.textContent = `Value: ${input.value}`;
    input.addEventListener('input', () => {
      output.textContent = `Value: ${input.value}`;
      if (object.interaction?.slider?.variableId) {
        updateSessionAndRender(
          runtimeState,
          setVariableValue(runtimeState.project, runtimeState.session, object.interaction.slider.variableId, Number(input.value)),
          render
        );
      }
    });
    wrapper.append(label, input, output);
    return wrapper;
  }

  if (object.interaction?.marker) {
    const wrapper = documentNode.createElement('div');
    wrapper.className = 'cw-marker';
    const button = documentNode.createElement('button');
    button.className = 'cw-marker__toggle';
    button.textContent = object.interaction.marker.label;
    button.addEventListener('click', () => {
      uiState.markerOpen[object.id] = !uiState.markerOpen[object.id];
      render();
    });
    wrapper.append(button);
    if (uiState.markerOpen[object.id]) {
      const panel = documentNode.createElement('div');
      panel.className = 'cw-marker__panel';
      panel.textContent = object.interaction.marker.body;
      wrapper.append(panel);
    }
    return wrapper;
  }

  if (object.interaction?.branchingScenario) {
    const wrapper = documentNode.createElement('div');
    wrapper.className = 'cw-branching';
    const prompt = documentNode.createElement('strong');
    prompt.textContent = object.interaction.branchingScenario.prompt;
    const options = documentNode.createElement('div');
    options.className = 'cw-branching__options';
    object.interaction.branchingScenario.options.forEach((option) => {
      const button = documentNode.createElement('button');
      button.className = 'cw-branching__option';
      button.textContent = option.label;
      button.addEventListener('click', () => {
        let nextSession = runtimeState.session;
        if (option.setVariable) {
          nextSession = setVariableValue(
            runtimeState.project,
            nextSession,
            option.setVariable.variableId,
            option.setVariable.value
          );
        }
        if (option.goToSlideId) {
          nextSession = navigateToSlide(nextSession, option.goToSlideId);
        }
        updateSessionAndRender(runtimeState, nextSession, render);
      });
      options.append(button);
    });
    wrapper.append(prompt, options);
    return wrapper;
  }

  if (object.interaction?.dragDrop) {
    const wrapper = documentNode.createElement('div');
    wrapper.className = 'cw-dragdrop';
    const prompt = documentNode.createElement('strong');
    prompt.textContent = object.interaction.dragDrop.prompt;
    wrapper.append(prompt);

    const grid = documentNode.createElement('div');
    grid.className = 'cw-dragdrop__grid';
    object.interaction.dragDrop.pairs.forEach((pair) => {
      const row = documentNode.createElement('div');
      row.className = 'cw-dragdrop__pair';
      const drag = documentNode.createElement('div');
      drag.textContent = pair.dragId;
      drag.draggable = true;
      drag.style.padding = '12px';
      drag.style.background = '#eef6f3';
      drag.style.borderRadius = '12px';

      const drop = documentNode.createElement('div');
      drop.textContent = uiState.dragDropMatches[object.id]?.[pair.dragId] ?? 'Drop here';
      drop.style.padding = '12px';
      drop.style.background = '#f7f4ea';
      drop.style.borderRadius = '12px';
      drop.addEventListener('dragover', (event) => event.preventDefault());
      drop.addEventListener('drop', (event) => {
        event.preventDefault();
        const source = event.dataTransfer?.getData('text/plain');
        if (!source) {
          return;
        }
        uiState.dragDropMatches[object.id] = {
          ...(uiState.dragDropMatches[object.id] ?? {}),
          [pair.dragId]: source
        };
        render();
      });

      drag.addEventListener('dragstart', (event) => {
        event.dataTransfer?.setData('text/plain', pair.dropId);
      });

      row.append(drag, drop);
      grid.append(row);
    });
    wrapper.append(grid);
    return wrapper;
  }

  if (object.interaction?.quiz) {
    return renderQuizObject(documentNode, object, object.interaction.quiz, runtimeState, render);
  }

  return buildRichText(documentNode, object.text ?? object.name);
};

const createObjectElement = (
  documentNode: Document,
  project: ProjectDocument,
  object: SlideObject,
  uiState: RuntimeUiState,
  runtimeState: { session: RuntimeSession; project: ProjectDocument; options: RuntimePlayerOptions },
  render: () => void
) => {
  const elementTag = object.kind === 'button' || object.kind === 'hotspot' ? 'button' : 'div';
  const element = documentNode.createElement(elementTag);
  const resolvedObject = resolveObjectView(object, runtimeState.session);

  if (!resolvedObject.visible) {
    return undefined;
  }

  element.className = `cw-object cw-object--${resolvedObject.kind}`;
  applyObjectStyle(element as HTMLElement, resolvedObject);
  if (element instanceof HTMLButtonElement) {
    element.type = 'button';
  }

  switch (resolvedObject.kind) {
    case 'text':
    case 'caption':
      element.append(buildRichText(documentNode, resolvedObject.text ?? ''));
      break;
    case 'shape':
      if (resolvedObject.text) {
        element.append(buildRichText(documentNode, resolvedObject.text));
      }
      break;
    case 'image': {
      const asset = resolveAsset(project, resolvedObject.assetId);
      if (asset) {
        const image = documentNode.createElement('img');
        image.src = asset.source;
        image.alt = asset.name;
        element.append(image);
      } else {
        element.append(buildRichText(documentNode, resolvedObject.text ?? 'Select an image asset'));
      }
      break;
    }
    case 'button':
    case 'hotspot':
      element.textContent = resolvedObject.text ?? resolvedObject.name;
      element.addEventListener('click', () => {
        updateSessionAndRender(runtimeState, clickObject(runtimeState.project, runtimeState.session, resolvedObject.id), render);
      });
      break;
    case 'marker':
    case 'tabs':
    case 'accordion':
    case 'slider':
    case 'dragDrop':
    case 'branchingScenario':
    case 'quiz':
      element.append(renderInteractionObject(documentNode, resolvedObject, uiState, runtimeState, render));
      break;
    default:
      element.append(buildRichText(documentNode, resolvedObject.text ?? resolvedObject.name));
      break;
  }

  return element;
};

const buildTranscript = (documentNode: Document, slideAssets: MediaAsset[]) => {
  const transcripts = slideAssets.map((asset) => asset.transcript).filter(Boolean) as string[];
  if (!transcripts.length) {
    return undefined;
  }

  const node = documentNode.createElement('aside');
  node.className = 'cw-transcript';
  const title = documentNode.createElement('strong');
  title.textContent = 'Transcript';
  const body = documentNode.createElement('div');
  body.textContent = transcripts.join('\n\n');
  node.append(title, body);
  return node;
};

export const mountRuntimePlayer = (
  container: HTMLElement,
  projectInput: ProjectDocument,
  options: RuntimePlayerOptions = {}
): RuntimePlayerController => {
  const documentNode = container.ownerDocument;
  injectStyles(documentNode);

  const runtimeState = {
    project: projectInput,
    session: createRuntimeSession(projectInput),
    options
  };
  const uiState: RuntimeUiState = {
    tabsIndex: {},
    accordionOpen: {},
    markerOpen: {},
    dragDropMatches: {}
  };

  const render = () => {
    clearNode(container);
    const slide = getCurrentSlide(runtimeState.project, runtimeState.session);
    const slideOrder = getSlideOrder(runtimeState.project);
    const currentIndex = slideOrder.indexOf(slide.id);
    const visibleLayerIds = runtimeState.session.visibleLayerIds[slide.id] ?? [];
    const slideAssets = slide.objects.map((object) => resolveAsset(runtimeState.project, object.assetId)).filter(Boolean) as MediaAsset[];

    const player = documentNode.createElement('div');
    player.className = 'cw-player';

    const header = documentNode.createElement('header');
    header.className = 'cw-player__header';

    const meta = documentNode.createElement('div');
    meta.className = 'cw-player__meta';
    const kicker = documentNode.createElement('div');
    kicker.className = 'cw-player__kicker';
    kicker.textContent = runtimeState.options.mode === 'preview' ? 'Preview mode' : 'Runtime player';
    const title = documentNode.createElement('h2');
    title.className = 'cw-player__title';
    title.textContent = slide.title;
    const subtitle = documentNode.createElement('p');
    subtitle.className = 'cw-player__subtitle';
    subtitle.textContent = `${runtimeState.project.title} · Slide ${currentIndex + 1} of ${slideOrder.length}`;
    meta.append(kicker, title, subtitle);

    const nav = documentNode.createElement('div');
    nav.className = 'cw-player__nav';

    const prev = documentNode.createElement('button');
    prev.type = 'button';
    prev.textContent = 'Previous';
    prev.disabled = currentIndex <= 0;
    prev.addEventListener('click', () => {
      const prevId = slideOrder[currentIndex - 1];
      if (prevId) {
        updateSessionAndRender(runtimeState, navigateToSlide(runtimeState.session, prevId), render);
      }
    });

    const next = documentNode.createElement('button');
    next.type = 'button';
    next.textContent = 'Next';
    next.disabled = currentIndex >= slideOrder.length - 1;
    next.addEventListener('click', () => {
      const nextId = slideOrder[currentIndex + 1];
      if (nextId) {
        updateSessionAndRender(runtimeState, navigateToSlide(runtimeState.session, nextId), render);
      }
    });

    nav.append(prev, next);
    header.append(meta, nav);

    const viewport = documentNode.createElement('section');
    viewport.className = 'cw-player__viewport';

    const stage = documentNode.createElement('div');
    stage.className = 'cw-player__stage';
    stage.style.width = `${runtimeState.project.playerSettings.width}px`;
    stage.style.height = `${runtimeState.project.playerSettings.height}px`;
    stage.style.aspectRatio = `${runtimeState.project.playerSettings.width} / ${runtimeState.project.playerSettings.height}`;
    stage.style.background = slide.background || runtimeState.project.theme.colors.canvas;

    slide.layers
      .filter((layer) => visibleLayerIds.includes(layer.id))
      .forEach((layer) => {
        const layerNode = documentNode.createElement('div');
        layerNode.className = 'cw-layer';
        layer.objectIds
          .map((objectId) => slide.objects.find((object) => object.id === objectId))
          .filter(Boolean)
          .forEach((object) => {
            const objectNode = createObjectElement(documentNode, runtimeState.project, object as SlideObject, uiState, runtimeState, render);
            if (objectNode) {
              layerNode.append(objectNode);
            }
          });
        stage.append(layerNode);
      });

    const captionObjects = slide.objects
      .map((object) => resolveObjectView(object, runtimeState.session))
      .filter((object) => object.kind === 'caption' && object.visible);

    if (captionObjects.length) {
      const caption = documentNode.createElement('div');
      caption.className = 'cw-caption';
      caption.textContent = captionObjects.map((item) => item.text).filter(Boolean).join(' ');
      stage.append(caption);
    }

    viewport.append(stage);
    player.append(header, viewport);

    if (runtimeState.project.playerSettings.showTranscriptPanel) {
      const transcript = buildTranscript(documentNode, slideAssets);
      if (transcript) {
        player.append(transcript);
      }
    }

    container.append(player);
  };

  render();

  return {
    getSession: () => runtimeState.session,
    setProject: (project) => {
      runtimeState.project = project;
      runtimeState.session = createRuntimeSession(project);
      render();
    },
    dispose: () => {
      clearNode(container);
    }
  };
};

export const getRuntimeStyles = () => runtimeStyles;