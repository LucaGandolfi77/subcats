import { mountRuntimePlayer } from '@courseweaver/runtime';
import { useEffect, useRef } from 'react';

import type { ProjectDocument } from '@courseweaver/domain';

interface PreviewModalProps {
  project: ProjectDocument;
  onClose: () => void;
}

export const PreviewModal = ({ project, onClose }: PreviewModalProps) => {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hostRef.current) {
      return;
    }

    const controller = mountRuntimePlayer(hostRef.current, project, { mode: 'preview' });
    return () => controller.dispose();
  }, [project]);

  return (
    <div className="preview-modal" role="dialog" aria-modal="true">
      <div className="preview-modal__surface">
        <div className="preview-modal__header">
          <div>
            <p className="toolbar__eyebrow">Runtime Preview</p>
            <h2>{project.title}</h2>
          </div>
          <button type="button" onClick={onClose}>Close</button>
        </div>
        <div className="preview-modal__body" ref={hostRef} />
      </div>
    </div>
  );
};