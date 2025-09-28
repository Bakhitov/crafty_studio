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
	const [ready, setReady] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const objectUrlRef = useRef<string | null>(null);
	const markerAreaRef = useRef<any>(null);
	const targetImgRef = useRef<HTMLImageElement | null>(null);

	const imgSrc = useMemo(() => imageUrl, [imageUrl]);

	useEffect(() => {
		let cancelled = false;
		(async () => {
			try {
				setError(null);
				// Load marker.js lazily
				const marker = await import('@markerjs/markerjs3');
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

				const area = new marker.MarkerArea();
				markerAreaRef.current = area;
				area.targetImage = img;

				if (containerRef.current) {
					containerRef.current.innerHTML = '';
					containerRef.current.appendChild(area);
				}

				// Optionally, could restore previous annotation state here if API supports it.

				setReady(true);
			} catch (e) {
				setError((e as Error).message);
			}
		})();
		return () => {
			cancelled = true;
			try {
				if (markerAreaRef.current && markerAreaRef.current.parentElement) {
					markerAreaRef.current.parentElement.removeChild(markerAreaRef.current);
				}
			} catch {}
			if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
			markerAreaRef.current = null;
			targetImgRef.current = null;
		};
	}, [imgSrc, initialState]);

	const handleSave = async () => {
		if (!markerAreaRef.current || !targetImgRef.current || loading) return;
		setLoading(true);
		try {
			const marker = await import('@markerjs/markerjs3');
			const renderer = new marker.Renderer();
			renderer.targetImage = targetImgRef.current;
			const state = markerAreaRef.current.getState?.() ?? {};
			const dataUrl = await renderer.rasterize(state);
			const res = await fetch(dataUrl);
			const blob = await res.blob();
			const file = new File([blob], `edited-${Date.now()}.png`, { type: 'image/png' });
			await onSave(file, state);
		} catch (e) {
			setError((e as Error).message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className={className}>
			<div className="flex items-center justify-between gap-2 px-4 py-2 border-b">
				<div className="flex items-center gap-2">
					<span className="text-sm text-muted-foreground">Редактор изображения</span>
					<div className="ml-4 flex items-center gap-1">
						<button
							type="button"
							className="inline-flex h-8 items-center justify-center rounded-full bg-secondary px-3 text-xs"
							onClick={() => markerAreaRef.current?.createMarker?.('RectangleMarker')}
						>
							Прямоугольник
						</button>
						<button
							type="button"
							className="inline-flex h-8 items-center justify-center rounded-full bg-secondary px-3 text-xs"
							onClick={() => markerAreaRef.current?.createMarker?.('EllipseMarker')}
						>
							Эллипс
						</button>
						<button
							type="button"
							className="inline-flex h-8 items-center justify-center rounded-full bg-secondary px-3 text-xs"
							onClick={() => markerAreaRef.current?.createMarker?.('ArrowMarker')}
						>
							Стрелка
						</button>
						<button
							type="button"
							className="inline-flex h-8 items-center justify-center rounded-full bg-secondary px-3 text-xs"
							onClick={() => markerAreaRef.current?.createMarker?.('TextMarker')}
						>
							Текст
						</button>
						<button
							type="button"
							className="inline-flex h-8 items-center justify-center rounded-full bg-secondary px-3 text-xs"
							onClick={() => markerAreaRef.current?.createMarker?.('FreehandMarker')}
						>
							Кисть
						</button>
					</div>
				</div>
				<div className="flex items-center gap-2">
					<button
						type="button"
						className="inline-flex h-8 items-center justify-center rounded-full bg-secondary px-3 text-xs"
						onClick={onCancel}
					>
						Отмена
					</button>
					<button
						type="button"
						disabled={!ready || loading}
						className="inline-flex h-8 items-center justify-center rounded-full bg-primary px-3 text-xs text-primary-foreground disabled:opacity-50"
						onClick={handleSave}
					>
						{loading ? 'Сохраняем…' : 'Сохранить'}
					</button>
				</div>
			</div>
			{error ? (
				<div className="px-4 py-2 text-xs text-destructive">{error}</div>
			) : null}
			<div ref={containerRef} className="h-[calc(100vh-56px)] w-full overflow-hidden" />
		</div>
	);
}

