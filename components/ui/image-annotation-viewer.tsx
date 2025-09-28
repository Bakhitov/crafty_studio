'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type ImageAnnotationViewerProps = {
	imageUrl: string;
	state: unknown;
	className?: string;
};

export function ImageAnnotationViewer({ imageUrl, state, className }: ImageAnnotationViewerProps) {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const [error, setError] = useState<string | null>(null);
	const objectUrlRef = useRef<string | null>(null);
	const viewerRef = useRef<any>(null);
	const targetImgRef = useRef<HTMLImageElement | null>(null);

	const imgSrc = useMemo(() => imageUrl, [imageUrl]);

	useEffect(() => {
		let cancelled = false;
		(async () => {
			try {
				setError(null);
				const { AnnotationViewer } = await import('@markerjs/markerjs-ui');
				if (cancelled) return;

				const resp = await fetch(imgSrc, { cache: 'no-store' });
				const blob = await resp.blob();
				const objUrl = URL.createObjectURL(blob);
				objectUrlRef.current = objUrl;

				const img = document.createElement('img');
				img.src = objUrl;
				img.alt = 'Annotated image';
				img.style.width = '100%';
				img.style.height = '100%';
				img.style.objectFit = 'cover';
				targetImgRef.current = img;

				const viewer = new AnnotationViewer();
				viewerRef.current = viewer;
				viewer.targetImage = img;

				if (containerRef.current) {
					containerRef.current.innerHTML = '';
					containerRef.current.appendChild(img);
					containerRef.current.appendChild(viewer);
				}

				try {
					viewer.show(state as never);
				} catch {}
			} catch (e) {
				setError((e as Error).message);
			}
		})();
		return () => {
			cancelled = true;
			try {
				if (viewerRef.current && viewerRef.current.parentElement) {
					viewerRef.current.parentElement.removeChild(viewerRef.current);
				}
			} catch {}
			if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
			viewerRef.current = null;
			targetImgRef.current = null;
		};
	}, [imgSrc, state]);

	return (
		<div ref={containerRef} className={className} style={{ position: 'relative', width: '100%', height: '100%' }}>
			{error ? (
				<div className="absolute inset-0 z-10 flex items-center justify-center text-xs text-destructive bg-background/50">
					{error}
				</div>
			) : null}
		</div>
	);
}

