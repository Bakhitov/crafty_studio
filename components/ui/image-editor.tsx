'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type ImageEditorProps = {
	imageUrl: string;
	initialState?: unknown;
	onSave: (file: File, state: unknown) => Promise<void> | void;
	onCancel: () => void;
	className?: string;
};

export function ImageEditor({ imageUrl, initialState, onSave, onCancel, className }: ImageEditorProps) {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const [error, setError] = useState<string | null>(null);
	const objectUrlRef = useRef<string | null>(null);
	const editorRef = useRef<any>(null);
	const targetImgRef = useRef<HTMLImageElement | null>(null);

	const imgSrc = useMemo(() => imageUrl, [imageUrl]);

	useEffect(() => {
		let cancelled = false;
		(async () => {
			try {
				setError(null);
				const { AnnotationEditor } = await import('@markerjs/markerjs-ui');
				if (cancelled) return;

				// Prepare image element; fetch as blob to avoid CORS tainting
				const resp = await fetch(imgSrc, { cache: 'no-store' });
				const blob = await resp.blob();
				const objUrl = URL.createObjectURL(blob);
				objectUrlRef.current = objUrl;

				const img = document.createElement('img');
				img.src = objUrl;
				img.alt = 'Editable image';
				targetImgRef.current = img;

				const editor = new AnnotationEditor();
				editorRef.current = editor;
				editor.targetImage = img;
				// Mount editor UI
				if (containerRef.current) {
					containerRef.current.innerHTML = '';
					containerRef.current.appendChild(editor);
				}

				// Load previous state if provided (method availability may vary across UI builds)
				if (initialState) {
					try {
						(editor as any).show?.(initialState as never);
					} catch {}
				}

				// Wire save event
				editor.addEventListener('editorsave', async (event: any) => {
					try {
						const dataUrl: string | undefined = event?.detail?.dataUrl;
						const state = event?.detail?.state ?? {};
						if (!dataUrl) return;
						const res = await fetch(dataUrl);
						const outBlob = await res.blob();
						const file = new File([outBlob], `edited-${Date.now()}.png`, { type: 'image/png' });
						await onSave(file, state);
					} catch (e) {
						setError((e as Error).message);
					}
				});
			} catch (e) {
				setError((e as Error).message);
			}
		})();
		return () => {
			cancelled = true;
			try {
				if (editorRef.current && editorRef.current.parentElement) {
					editorRef.current.parentElement.removeChild(editorRef.current);
				}
			} catch {}
			if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
			editorRef.current = null;
			targetImgRef.current = null;
		};
	}, [imgSrc, initialState, onSave]);

	return (
		<div className={className}>
			{error ? (
				<div className="px-4 py-2 text-xs text-destructive">{error}</div>
			) : null}
			<div ref={containerRef} className="h-[100vh] w-[100vw] overflow-hidden" />
			{/* Local close button as a fallback */}
			<button
				type="button"
				className="fixed right-4 top-4 z-[200] inline-flex h-9 w-9 items-center justify-center rounded-full bg-secondary hover:bg-secondary/80"
				onClick={onCancel}
				aria-label="Close editor"
			>
				<span className="sr-only">Close</span>
				{/* simplistic X */}
				<div className="relative block h-3 w-3">
					<div className="absolute left-1/2 top-1/2 h-3 w-0.5 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-foreground" />
					<div className="absolute left-1/2 top-1/2 h-3 w-0.5 -translate-x-1/2 -translate-y-1/2 -rotate-45 bg-foreground" />
				</div>
			</button>
		</div>
	);
}

