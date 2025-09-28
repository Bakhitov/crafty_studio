import { describeAction } from '@/app/actions/image/describe';
import { NodeLayout } from '@/components/nodes/layout';
import { DropzoneEmptyState } from '@/components/ui/kibo-ui/dropzone';
import { DropzoneContent } from '@/components/ui/kibo-ui/dropzone';
import { Dropzone } from '@/components/ui/kibo-ui/dropzone';
import { Skeleton } from '@/components/ui/skeleton';
import { handleError } from '@/lib/error/handle';
import { uploadFile } from '@/lib/upload';
import { useProject } from '@/providers/project';
import { useReactFlow } from '@xyflow/react';
import { Loader2Icon } from 'lucide-react';
import Image from 'next/image';
import { ImageZoom } from '@/components/ui/kibo-ui/image-zoom';
import dynamic from 'next/dynamic';
const ImageAnnotationViewer = dynamic<{ imageUrl: string; state: unknown }>(
  () => import('@/components/ui/image-annotation-viewer').then((m) => m.ImageAnnotationViewer),
  { ssr: false }
);
import { useState } from 'react';
import type { ImageNodeProps } from '.';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const ImageEditor = dynamic(() => import('@/components/ui/image-editor').then(m => m.ImageEditor), { ssr: false });

type ImagePrimitiveProps = ImageNodeProps & {
  title: string;
};

export const ImagePrimitive = ({
  data,
  id,
  type,
  title,
}: ImagePrimitiveProps) => {
  const { updateNodeData } = useReactFlow();
  const project = useProject();
  const [files, setFiles] = useState<File[] | undefined>();
  const [isUploading, setIsUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const handleDrop = async (files: File[]) => {
    if (isUploading || !project?.id) {
      return;
    }

    try {
      if (!files.length) {
        throw new Error('No file selected');
      }

      setIsUploading(true);
      setFiles(files);
      const [file] = files;
      const { url, type } = await uploadFile(file, 'files');

      updateNodeData(id, {
        content: {
          url,
          type,
        },
      });

      const description = await describeAction(url, project?.id);

      if ('error' in description) {
        throw new Error(description.error);
      }

      updateNodeData(id, {
        description: description.description,
      });
    } catch (error) {
      handleError('Error uploading image', error);
    } finally {
      setIsUploading(false);
    }
  };

  const toolbar = [
    {
      children: (
        <Button size="icon" className="rounded-full" disabled={!data.content?.url} onClick={() => setIsEditing(true)}>
          Edit
        </Button>
      ),
    },
  ];

  return (
    <NodeLayout id={id} data={data} type={type} title={title} toolbar={toolbar}>
      {isUploading && (
        <Skeleton className="flex aspect-video w-full animate-pulse items-center justify-center">
          <Loader2Icon
            size={16}
            className="size-4 animate-spin text-muted-foreground"
          />
        </Skeleton>
      )}
      {!isUploading && data.content && (
        <div className="relative">
          <ImageZoom>
            <Image
              src={data.content.url}
              alt="Image"
              width={data.width ?? 1000}
              height={data.height ?? 1000}
              className="h-auto w-full"
            />
          </ImageZoom>
          {Boolean((data as any)?.annotationState) && (
            <div className="absolute inset-0 pointer-events-none">
              <ImageAnnotationViewer imageUrl={data.content.url} state={(data as any).annotationState} />
            </div>
          )}
        </div>
      )}
      {!isUploading && !data.content && (
        <Dropzone
          maxSize={1024 * 1024 * 10}
          minSize={1024}
          maxFiles={1}
          multiple={false}
          accept={{
            'image/*': [],
          }}
          onDrop={handleDrop}
          src={files}
          onError={console.error}
          className="rounded-none border-none bg-transparent p-0 shadow-none hover:bg-transparent dark:bg-transparent dark:hover:bg-transparent"
        >
          <DropzoneEmptyState className="p-4" />
          <DropzoneContent />
        </Dropzone>
      )}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-[100vw] h-[100vh] p-0">
          <DialogHeader>
            <DialogTitle className="sr-only">Редактирование изображения</DialogTitle>
          </DialogHeader>
          <div className="h-full w-full">
            {data.content?.url ? (
              <ImageEditor
                imageUrl={data.content.url}
                onCancel={() => setIsEditing(false)}
                onSave={async (file, state) => {
                  try {
                    if (!project?.id) return;
                    const { url, type } = await uploadFile(file, 'files');
                    updateNodeData(id, {
                      content: { url, type },
                      annotationState: state,
                      updatedAt: new Date().toISOString(),
                    });
                    setIsEditing(false);
                    if (typeof window !== 'undefined') {
                      window.dispatchEvent(new Event('user-files:changed'));
                    }
                  } catch (e) {
                    handleError('Error saving edited image', e);
                  }
                }}
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </NodeLayout>
  );
};
