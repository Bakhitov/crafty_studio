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
		const keydown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				try { onCancel(); } catch {}
			}
		};
		window.addEventListener('keydown', keydown);

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

				// Show editor (with or without state) if method exists
				try {
					if ((editor as any).show) {
						if (typeof initialState !== 'undefined') (editor as any).show(initialState as never);
						else (editor as any).show();
					}
				} catch {}

				const handleSave = async (event: any) => {
					try {
						const dataUrl: string | undefined = event?.detail?.dataUrl;
						const state = event?.detail?.state ?? {};
						if (!dataUrl) return;
						const res = await fetch(dataUrl);
						const outBlob = await res.blob();
						const file = new File([outBlob], `edited-${Date.now()}.png`, { type: 'image/png' });
						await onSave(file, state);
						// Ensure the overlay closes after successful save
						try { onCancel(); } catch {}
					} catch (e) {
						setError((e as Error).message);
					}
				};

				const handleClose = () => { try { onCancel(); } catch {} };

				// Wire save/close events (support multiple event names across versions)
				editor.addEventListener('editorsave', handleSave as EventListener);
				editor.addEventListener('save', handleSave as EventListener);
				editor.addEventListener('editorclose', handleClose as EventListener);
				editor.addEventListener('close', handleClose as EventListener);
			} catch (e) {
				setError((e as Error).message);
			}
		})();
		return () => {
			cancelled = true;
			window.removeEventListener('keydown', keydown);
			try {
				if (editorRef.current) {
					editorRef.current.removeEventListener?.('editorsave', () => {});
					editorRef.current.removeEventListener?.('save', () => {});
					editorRef.current.removeEventListener?.('editorclose', () => {});
					editorRef.current.removeEventListener?.('close', () => {});
					if (editorRef.current.parentElement) {
						editorRef.current.parentElement.removeChild(editorRef.current);
					}
				}
			} catch {}
			if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
			editorRef.current = null;
			targetImgRef.current = null;
		};
	}, [imgSrc, initialState, onSave, onCancel]);

	return (
		<div className={className}>
			{error ? (
				<div className="px-4 py-2 text-xs text-destructive">{error}</div>
			) : null}
			<div ref={containerRef} className="h-[100vh] w-[100vw] overflow-hidden" />
		</div>
	);
}