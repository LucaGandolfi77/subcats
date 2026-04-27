import type { MediaAsset, ProjectDocument } from '@courseweaver/domain';

export interface AssetManifestEntry {
  id: string;
  name: string;
  kind: MediaAsset['kind'];
  sourceType: 'inline' | 'external';
  transcriptIncluded: boolean;
  captionCount: number;
}

export interface AssetManifest {
  totalAssets: number;
  totalTranscripts: number;
  entries: AssetManifestEntry[];
}

const detectSourceType = (source: string): AssetManifestEntry['sourceType'] =>
  source.startsWith('data:') ? 'inline' : 'external';

export const buildAssetManifest = (project: ProjectDocument): AssetManifest => ({
  totalAssets: project.assets.length,
  totalTranscripts: project.assets.filter((asset) => asset.transcript).length,
  entries: project.assets.map((asset) => ({
    id: asset.id,
    name: asset.name,
    kind: asset.kind,
    sourceType: detectSourceType(asset.source),
    transcriptIncluded: Boolean(asset.transcript),
    captionCount: asset.captions?.length ?? 0
  }))
});

export const collectReferencedAssets = (project: ProjectDocument) => {
  const referencedIds = new Set(
    project.slides.flatMap((slide) => slide.objects.map((object) => object.assetId).filter(Boolean) as string[])
  );

  return project.assets.filter((asset) => referencedIds.has(asset.id));
};