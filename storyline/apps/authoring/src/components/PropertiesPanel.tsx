import {
  comparisonOperators,
  scormCreditModes,
  scormLessonModes,
  scormTimeLimitActions,
  scormVersions,
  triggerActionTypes,
  triggerEvents,
  variableKinds,
  type SlideObject,
  type TriggerActionType
} from '@courseweaver/domain';

import { selectActiveScene, selectActiveSlide, selectSelectedObject, toScalarValue, useAuthoringStore } from '../state/useAuthoringStore';

const numberValue = (value: string, fallback = 0) => {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const optionalNumberValue = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  const parsed = Number(trimmed);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const listValue = (value: string) => value
  .split(',')
  .map((entry) => entry.trim())
  .filter(Boolean);

const describeObject = (object: SlideObject) => object.text || object.name || object.kind;

const actionNeedsTarget = (type: TriggerActionType) => ['showLayer', 'hideLayer', 'toggleLayer', 'jumpToSlide', 'changeState', 'submitQuiz'].includes(type);
const actionNeedsVariable = (type: TriggerActionType) => type === 'setVariable';
const actionNeedsState = (type: TriggerActionType) => type === 'changeState';
const actionNeedsMedia = (type: TriggerActionType) => type === 'playMedia';

export const PropertiesPanel = () => {
  const project = useAuthoringStore((state) => state.project);
  const activeScene = useAuthoringStore(selectActiveScene);
  const activeSlide = useAuthoringStore(selectActiveSlide);
  const selectedObject = useAuthoringStore(selectSelectedObject);
  const updateProject = useAuthoringStore((state) => state.updateProject);
  const updateScene = useAuthoringStore((state) => state.updateScene);
  const updateActiveSlide = useAuthoringStore((state) => state.updateActiveSlide);
  const updateObject = useAuthoringStore((state) => state.updateObject);
  const addStateToObject = useAuthoringStore((state) => state.addStateToObject);
  const updateObjectState = useAuthoringStore((state) => state.updateObjectState);
  const setDefaultState = useAuthoringStore((state) => state.setDefaultState);
  const addTriggerToObject = useAuthoringStore((state) => state.addTriggerToObject);
  const updateTrigger = useAuthoringStore((state) => state.updateTrigger);
  const addTriggerAction = useAuthoringStore((state) => state.addTriggerAction);
  const updateTriggerAction = useAuthoringStore((state) => state.updateTriggerAction);
  const addTriggerCondition = useAuthoringStore((state) => state.addTriggerCondition);
  const updateTriggerCondition = useAuthoringStore((state) => state.updateTriggerCondition);
  const courseMetadata = project.courseMetadata;
  const scormSettings = project.publishing.scorm;

  if (!selectedObject) {
    return (
      <aside className="properties">
        <section className="panel-card">
          <div className="panel-card__header">
            <h2>Project</h2>
          </div>
          <label className="field">
            <span>Title</span>
            <input value={project.title} onChange={(event) => updateProject((draft) => {
              draft.title = event.target.value;
            })} />
          </label>
          <label className="field">
            <span>Description</span>
            <textarea value={project.description} onChange={(event) => updateProject((draft) => {
              draft.description = event.target.value;
            })} />
          </label>

          <div className="subpanel">
            <div className="subpanel__header">
              <h3>Course metadata</h3>
            </div>
            <div className="field-grid">
              <label className="field">
                <span>Slug</span>
                <input value={courseMetadata.slug} onChange={(event) => updateProject((draft) => {
                  draft.courseMetadata.slug = event.target.value;
                })} />
              </label>
              <label className="field">
                <span>Language</span>
                <input value={courseMetadata.language} onChange={(event) => updateProject((draft) => {
                  draft.courseMetadata.language = event.target.value;
                })} placeholder="en" />
              </label>
              <label className="field">
                <span>Provider</span>
                <input value={courseMetadata.provider} onChange={(event) => updateProject((draft) => {
                  draft.courseMetadata.provider = event.target.value;
                })} />
              </label>
              <label className="field">
                <span>Subject</span>
                <input value={courseMetadata.subject} onChange={(event) => updateProject((draft) => {
                  draft.courseMetadata.subject = event.target.value;
                })} />
              </label>
              <label className="field">
                <span>Duration minutes</span>
                <input
                  type="number"
                  min={1}
                  value={courseMetadata.durationMinutes ?? ''}
                  onChange={(event) => updateProject((draft) => {
                    const nextValue = optionalNumberValue(event.target.value);
                    draft.courseMetadata.durationMinutes = nextValue ? Math.max(1, Math.round(nextValue)) : undefined;
                  })}
                />
              </label>
              <label className="field">
                <span>Keywords</span>
                <input value={courseMetadata.keywords.join(', ')} onChange={(event) => updateProject((draft) => {
                  draft.courseMetadata.keywords = listValue(event.target.value);
                })} placeholder="onboarding, compliance, support" />
              </label>
            </div>
          </div>

          <div className="subpanel">
            <div className="subpanel__header">
              <h3>SCORM publishing</h3>
            </div>
            <div className="field-grid">
              <label className="field">
                <span>Version</span>
                <select value={scormSettings.version} onChange={(event) => updateProject((draft) => {
                  draft.publishing.scorm.version = event.target.value as (typeof scormVersions)[number];
                })}>
                  {scormVersions.map((version) => (
                    <option key={version} value={version}>{version}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Package identifier</span>
                <input value={scormSettings.packageIdentifier} onChange={(event) => updateProject((draft) => {
                  draft.publishing.scorm.packageIdentifier = event.target.value;
                })} placeholder="cw.course_slug" />
              </label>
              <label className="field">
                <span>Organization title</span>
                <input value={scormSettings.organizationTitle} onChange={(event) => updateProject((draft) => {
                  draft.publishing.scorm.organizationTitle = event.target.value;
                })} />
              </label>
              <label className="field">
                <span>Launch item title</span>
                <input value={scormSettings.itemTitle} onChange={(event) => updateProject((draft) => {
                  draft.publishing.scorm.itemTitle = event.target.value;
                })} />
              </label>
              <label className="field">
                <span>Mastery score</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={scormSettings.masteryScore}
                  onChange={(event) => updateProject((draft) => {
                    draft.publishing.scorm.masteryScore = Math.min(100, Math.max(0, numberValue(event.target.value, draft.publishing.scorm.masteryScore)));
                  })}
                />
              </label>
              <label className="field">
                <span>Max time allowed</span>
                <input value={scormSettings.maxTimeAllowed ?? ''} onChange={(event) => updateProject((draft) => {
                  const trimmed = event.target.value.trim();
                  draft.publishing.scorm.maxTimeAllowed = trimmed || undefined;
                })} placeholder="00:30:00" />
              </label>
              <label className="field">
                <span>Time limit action</span>
                <select value={scormSettings.timeLimitAction} onChange={(event) => updateProject((draft) => {
                  draft.publishing.scorm.timeLimitAction = event.target.value as (typeof scormTimeLimitActions)[number];
                })}>
                  {scormTimeLimitActions.map((action) => (
                    <option key={action} value={action}>{action}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Credit mode</span>
                <select value={scormSettings.credit} onChange={(event) => updateProject((draft) => {
                  draft.publishing.scorm.credit = event.target.value as (typeof scormCreditModes)[number];
                })}>
                  {scormCreditModes.map((mode) => (
                    <option key={mode} value={mode}>{mode}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Lesson mode</span>
                <select value={scormSettings.lessonMode} onChange={(event) => updateProject((draft) => {
                  draft.publishing.scorm.lessonMode = event.target.value as (typeof scormLessonModes)[number];
                })}>
                  {scormLessonModes.map((mode) => (
                    <option key={mode} value={mode}>{mode}</option>
                  ))}
                </select>
              </label>
            </div>
            <label className="field">
              <span>Data from LMS</span>
              <textarea value={scormSettings.dataFromLms ?? ''} onChange={(event) => updateProject((draft) => {
                const trimmed = event.target.value.trim();
                draft.publishing.scorm.dataFromLms = trimmed || undefined;
              })} placeholder="Optional LMS launch payload" />
            </label>
          </div>

          <label className="field">
            <span>Scene title</span>
            <input value={activeScene.title} onChange={(event) => updateScene(activeScene.id, (draft) => {
              draft.title = event.target.value;
            })} />
          </label>
          <label className="field">
            <span>Slide title</span>
            <input value={activeSlide.title} onChange={(event) => updateActiveSlide((draft) => {
              draft.title = event.target.value;
            })} />
          </label>
          <label className="field">
            <span>Slide notes</span>
            <textarea value={activeSlide.notes} onChange={(event) => updateActiveSlide((draft) => {
              draft.notes = event.target.value;
            })} />
          </label>
          <label className="field">
            <span>Slide background</span>
            <input value={activeSlide.background || ''} onChange={(event) => updateActiveSlide((draft) => {
              draft.background = event.target.value;
            })} placeholder="#f3efe3 or image url" />
          </label>
        </section>
      </aside>
    );
  }

  const targetStates = activeSlide.objects.find((object) => object.id === selectedObject.id)?.states ?? [];

  return (
    <aside className="properties">
      <section className="panel-card">
        <div className="panel-card__header">
          <h2>Object</h2>
          <div className="panel-card__meta">{selectedObject.kind}</div>
        </div>

        <label className="field">
          <span>Name</span>
          <input value={selectedObject.name} onChange={(event) => updateObject(selectedObject.id, (draft) => {
            draft.name = event.target.value;
          })} />
        </label>

        {'text' in selectedObject ? (
          <label className="field">
            <span>Text</span>
            <textarea value={selectedObject.text || ''} onChange={(event) => updateObject(selectedObject.id, (draft) => {
              draft.text = event.target.value;
            })} />
          </label>
        ) : null}

        <div className="field-grid">
          <label className="field">
            <span>X</span>
            <input
              type="number"
              value={selectedObject.position.x}
              onChange={(event) => updateObject(selectedObject.id, (draft) => {
                draft.position.x = numberValue(event.target.value, draft.position.x);
              })}
            />
          </label>
          <label className="field">
            <span>Y</span>
            <input
              type="number"
              value={selectedObject.position.y}
              onChange={(event) => updateObject(selectedObject.id, (draft) => {
                draft.position.y = numberValue(event.target.value, draft.position.y);
              })}
            />
          </label>
          <label className="field">
            <span>Width</span>
            <input
              type="number"
              value={selectedObject.position.width}
              onChange={(event) => updateObject(selectedObject.id, (draft) => {
                draft.position.width = Math.max(24, numberValue(event.target.value, draft.position.width));
              })}
            />
          </label>
          <label className="field">
            <span>Height</span>
            <input
              type="number"
              value={selectedObject.position.height}
              onChange={(event) => updateObject(selectedObject.id, (draft) => {
                draft.position.height = Math.max(24, numberValue(event.target.value, draft.position.height));
              })}
            />
          </label>
        </div>

        <div className="field-grid">
          <label className="field">
            <span>Fill</span>
            <input value={selectedObject.style.fill || ''} onChange={(event) => updateObject(selectedObject.id, (draft) => {
              draft.style.fill = event.target.value;
            })} />
          </label>
          <label className="field">
            <span>Text color</span>
            <input value={selectedObject.style.textColor || ''} onChange={(event) => updateObject(selectedObject.id, (draft) => {
              draft.style.textColor = event.target.value;
            })} />
          </label>
          <label className="field">
            <span>Radius</span>
            <input
              type="number"
              value={selectedObject.style.borderRadius ?? 0}
              onChange={(event) => updateObject(selectedObject.id, (draft) => {
                draft.style.borderRadius = numberValue(event.target.value, 0);
              })}
            />
          </label>
          <label className="field">
            <span>Font size</span>
            <input
              type="number"
              value={selectedObject.style.fontSize ?? 16}
              onChange={(event) => updateObject(selectedObject.id, (draft) => {
                draft.style.fontSize = numberValue(event.target.value, 16);
              })}
            />
          </label>
        </div>

        {selectedObject.kind === 'image' ? (
          <label className="field">
            <span>Asset</span>
            <select
              value={selectedObject.assetId || ''}
              onChange={(event) => updateObject(selectedObject.id, (draft) => {
                draft.assetId = event.target.value || undefined;
              })}
            >
              <option value="">Select asset</option>
              {project.assets.map((asset) => (
                <option key={asset.id} value={asset.id}>{asset.name}</option>
              ))}
            </select>
          </label>
        ) : null}

        {selectedObject.kind === 'quiz' && selectedObject.interaction?.quiz ? (
          <div className="subpanel">
            <h3>Quiz</h3>
            <label className="field">
              <span>Prompt</span>
              <textarea value={selectedObject.interaction.quiz.prompt} onChange={(event) => updateObject(selectedObject.id, (draft) => {
                if (draft.interaction?.quiz) {
                  draft.interaction.quiz.prompt = event.target.value;
                }
              })} />
            </label>
            {selectedObject.interaction.quiz.options.map((option, index) => (
              <div key={option.id} className="field-grid field-grid--quiz">
                <label className="field">
                  <span>Option {index + 1}</span>
                  <input value={option.label} onChange={(event) => updateObject(selectedObject.id, (draft) => {
                    const quiz = draft.interaction?.quiz;
                    if (!quiz) {
                      return;
                    }
                    const target = quiz.options.find((entry) => entry.id === option.id);
                    if (target) {
                      target.label = event.target.value;
                    }
                  })} />
                </label>
                <label className="field field--checkbox">
                  <span>Correct</span>
                  <input
                    type="radio"
                    name={`correct-${selectedObject.id}`}
                    checked={selectedObject.interaction.quiz.correctOptionIds.includes(option.id)}
                    onChange={() => updateObject(selectedObject.id, (draft) => {
                      if (draft.interaction?.quiz) {
                        draft.interaction.quiz.correctOptionIds = [option.id];
                      }
                    })}
                  />
                </label>
              </div>
            ))}
          </div>
        ) : null}

        {selectedObject.kind === 'slider' && selectedObject.interaction?.slider ? (
          <div className="field-grid">
            <label className="field">
              <span>Min</span>
              <input type="number" value={selectedObject.interaction.slider.min} onChange={(event) => updateObject(selectedObject.id, (draft) => {
                if (draft.interaction?.slider) {
                  draft.interaction.slider.min = numberValue(event.target.value, 0);
                }
              })} />
            </label>
            <label className="field">
              <span>Max</span>
              <input type="number" value={selectedObject.interaction.slider.max} onChange={(event) => updateObject(selectedObject.id, (draft) => {
                if (draft.interaction?.slider) {
                  draft.interaction.slider.max = numberValue(event.target.value, 100);
                }
              })} />
            </label>
          </div>
        ) : null}
      </section>

      <section className="panel-card">
        <div className="panel-card__header">
          <h2>States</h2>
          <button type="button" onClick={() => addStateToObject(selectedObject.id)}>+ State</button>
        </div>
        <div className="stack-list">
          {selectedObject.states.map((state) => (
            <div key={state.id} className="stack-list__item stack-list__item--state">
              <label className="field">
                <span>Name</span>
                <input value={state.name} onChange={(event) => updateObjectState(selectedObject.id, state.id, (draft) => {
                  draft.name = event.target.value;
                })} />
              </label>
              <label className="field">
                <span>State text</span>
                <input value={state.text || ''} onChange={(event) => updateObjectState(selectedObject.id, state.id, (draft) => {
                  draft.text = event.target.value;
                })} />
              </label>
              <label className="field">
                <span>State fill</span>
                <input value={state.style?.fill || ''} onChange={(event) => updateObjectState(selectedObject.id, state.id, (draft) => {
                  draft.style = { ...(draft.style || {}), fill: event.target.value };
                })} />
              </label>
              <label className="field field--checkbox">
                <span>Default</span>
                <input type="radio" checked={selectedObject.defaultStateId === state.id} onChange={() => setDefaultState(selectedObject.id, state.id)} />
              </label>
            </div>
          ))}
        </div>
      </section>

      <section className="panel-card">
        <div className="panel-card__header">
          <h2>Triggers</h2>
          <button type="button" onClick={() => addTriggerToObject(selectedObject.id)}>+ Trigger</button>
        </div>
        <div className="stack-list">
          {selectedObject.triggers.map((trigger) => (
            <div key={trigger.id} className="stack-list__item stack-list__item--trigger">
              <label className="field">
                <span>Name</span>
                <input value={trigger.name} onChange={(event) => updateTrigger(selectedObject.id, trigger.id, (draft) => {
                  draft.name = event.target.value;
                })} />
              </label>
              <div className="field-grid">
                <label className="field">
                  <span>Event</span>
                  <select value={trigger.event} onChange={(event) => updateTrigger(selectedObject.id, trigger.id, (draft) => {
                    draft.event = event.target.value as (typeof triggerEvents)[number];
                    draft.sourceObjectId = draft.event === 'onClick' ? selectedObject.id : undefined;
                  })}>
                    {triggerEvents.map((eventValue) => (
                      <option key={eventValue} value={eventValue}>{eventValue}</option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Order</span>
                  <input type="number" value={trigger.order} onChange={(event) => updateTrigger(selectedObject.id, trigger.id, (draft) => {
                    draft.order = numberValue(event.target.value, draft.order);
                  })} />
                </label>
              </div>

              {trigger.event === 'onVariableChange' ? (
                <label className="field">
                  <span>Watch variable</span>
                  <select value={trigger.watchVariableId || ''} onChange={(event) => updateTrigger(selectedObject.id, trigger.id, (draft) => {
                    draft.watchVariableId = event.target.value || undefined;
                  })}>
                    <option value="">Select variable</option>
                    {project.variables.map((variable) => (
                      <option key={variable.id} value={variable.id}>{variable.name}</option>
                    ))}
                  </select>
                </label>
              ) : null}

              <div className="subpanel">
                <div className="subpanel__header">
                  <h3>Conditions</h3>
                  <button type="button" onClick={() => addTriggerCondition(selectedObject.id, trigger.id)}>+ Condition</button>
                </div>
                {trigger.conditions.map((condition) => {
                  const variable = project.variables.find((entry) => entry.id === condition.variableId);
                  return (
                    <div key={condition.id} className="field-grid">
                      <label className="field">
                        <span>Variable</span>
                        <select value={condition.variableId} onChange={(event) => updateTriggerCondition(selectedObject.id, trigger.id, condition.id, (draft) => {
                          draft.variableId = event.target.value;
                        })}>
                          {project.variables.map((entry) => (
                            <option key={entry.id} value={entry.id}>{entry.name}</option>
                          ))}
                        </select>
                      </label>
                      <label className="field">
                        <span>Operator</span>
                        <select value={condition.operator} onChange={(event) => updateTriggerCondition(selectedObject.id, trigger.id, condition.id, (draft) => {
                          draft.operator = event.target.value as (typeof comparisonOperators)[number];
                        })}>
                          {comparisonOperators.map((entry) => (
                            <option key={entry} value={entry}>{entry}</option>
                          ))}
                        </select>
                      </label>
                      <label className="field">
                        <span>Value</span>
                        <input value={String(condition.value ?? '')} onChange={(event) => updateTriggerCondition(selectedObject.id, trigger.id, condition.id, (draft) => {
                          draft.value = variable ? toScalarValue(event.target.value, variable.defaultValue) : event.target.value;
                        })} />
                      </label>
                    </div>
                  );
                })}
              </div>

              <div className="subpanel">
                <div className="subpanel__header">
                  <h3>Actions</h3>
                  <button type="button" onClick={() => addTriggerAction(selectedObject.id, trigger.id)}>+ Action</button>
                </div>
                {trigger.actions.map((action) => {
                  const actionTargetObject = activeSlide.objects.find((object) => object.id === action.targetId);
                  return (
                    <div key={action.id} className="stack-list__item stack-list__item--action">
                      <label className="field">
                        <span>Type</span>
                        <select value={action.type} onChange={(event) => updateTriggerAction(selectedObject.id, trigger.id, action.id, (draft) => {
                          draft.type = event.target.value as TriggerActionType;
                        })}>
                          {triggerActionTypes.map((entry) => (
                            <option key={entry} value={entry}>{entry}</option>
                          ))}
                        </select>
                      </label>

                      {actionNeedsTarget(action.type) ? (
                        <label className="field">
                          <span>Target</span>
                          <select value={action.targetId || ''} onChange={(event) => updateTriggerAction(selectedObject.id, trigger.id, action.id, (draft) => {
                            draft.targetId = event.target.value || undefined;
                          })}>
                            <option value="">Select target</option>
                            {['showLayer', 'hideLayer', 'toggleLayer'].includes(action.type) && activeSlide.layers.map((layer) => (
                              <option key={layer.id} value={layer.id}>{layer.name}</option>
                            ))}
                            {action.type === 'jumpToSlide' && project.slides.map((slide) => (
                              <option key={slide.id} value={slide.id}>{slide.title}</option>
                            ))}
                            {['changeState', 'submitQuiz'].includes(action.type) && activeSlide.objects.map((object) => (
                              <option key={object.id} value={object.id}>{describeObject(object)}</option>
                            ))}
                          </select>
                        </label>
                      ) : null}

                      {actionNeedsVariable(action.type) ? (
                        <div className="field-grid">
                          <label className="field">
                            <span>Variable</span>
                            <select value={action.variableId || ''} onChange={(event) => updateTriggerAction(selectedObject.id, trigger.id, action.id, (draft) => {
                              draft.variableId = event.target.value || undefined;
                            })}>
                              <option value="">Select variable</option>
                              {project.variables.map((variable) => (
                                <option key={variable.id} value={variable.id}>{variable.name}</option>
                              ))}
                            </select>
                          </label>
                          <label className="field">
                            <span>Value</span>
                            <input value={String(action.value ?? '')} onChange={(event) => updateTriggerAction(selectedObject.id, trigger.id, action.id, (draft) => {
                              const variable = project.variables.find((entry) => entry.id === draft.variableId);
                              draft.value = variable ? toScalarValue(event.target.value, variable.defaultValue) : event.target.value;
                            })} />
                          </label>
                        </div>
                      ) : null}

                      {actionNeedsState(action.type) ? (
                        <label className="field">
                          <span>State</span>
                          <select value={action.stateId || ''} onChange={(event) => updateTriggerAction(selectedObject.id, trigger.id, action.id, (draft) => {
                            draft.stateId = event.target.value || undefined;
                          })}>
                            <option value="">Select state</option>
                            {(actionTargetObject?.states ?? targetStates).map((state) => (
                              <option key={state.id} value={state.id}>{state.name}</option>
                            ))}
                          </select>
                        </label>
                      ) : null}

                      {actionNeedsMedia(action.type) ? (
                        <label className="field">
                          <span>Media</span>
                          <select value={action.mediaAssetId || ''} onChange={(event) => updateTriggerAction(selectedObject.id, trigger.id, action.id, (draft) => {
                            draft.mediaAssetId = event.target.value || undefined;
                          })}>
                            <option value="">Select asset</option>
                            {project.assets.map((asset) => (
                              <option key={asset.id} value={asset.id}>{asset.name}</option>
                            ))}
                          </select>
                        </label>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>
    </aside>
  );
};