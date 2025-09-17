'use client';

import { updateProfileAction } from '@/app/actions/profile/update';
import { Canvas } from '@/components/canvas';
import type { ImageNodeProps } from '@/components/nodes/image';
import type { TextNodeProps } from '@/components/nodes/text';
import { Toolbar } from '@/components/toolbar';
import { Button } from '@/components/ui/button';
import { useUser } from '@/hooks/use-user';
import { handleError } from '@/lib/error/handle';
import { nodeButtons } from '@/lib/node-buttons';
import { useProject } from '@/providers/project';
import { useSubscription } from '@/providers/subscription';
import { getIncomers, useReactFlow } from '@xyflow/react';
import { PlayIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

const TextNode = nodeButtons.find((button) => button.id === 'text');

if (!TextNode) {
  throw new Error('Text node not found');
}

type WelcomeDemoProps = {
  title: string;
  description: string;
};

export const WelcomeDemo = ({ title, description }: WelcomeDemoProps) => {
  const project = useProject();
  const { getNodes, getEdges } = useReactFlow();
  const [started, setStarted] = useState(false);
  const { isSubscribed, plan } = useSubscription();
  const stepsContainerRef = useRef<HTMLDivElement>(null);
  const [hasTextNode, setHasTextNode] = useState(false);
  const [hasFilledTextNode, setHasFilledTextNode] = useState(false);
  const [hasImageNode, setHasImageNode] = useState(false);
  const [hasConnectedImageNode, setHasConnectedImageNode] = useState(false);
  const [hasImageInstructions, setHasImageInstructions] = useState(false);
  const [hasGeneratedImage, setHasGeneratedImage] = useState(false);
  const user = useUser();
  const router = useRouter();

  useEffect(() => {
    // Run on mount to set initial state
    handleNodesChange();
  }, []);

  const handleFinishWelcome = async () => {
    if (!user || !project?.id) {
      return;
    }

    try {
      // Если ручной биллинг активен — попытаемся сразу выдать Hobby
      try {
        await fetch('/api/v1/credits/claim', { method: 'POST' });
      } catch {
        // игнорируем: не критично для завершения онбординга
      }

      const response = await updateProfileAction(user.id, {
        onboardedAt: new Date(),
      });

      if ('error' in response) {
        throw new Error(response.error);
      }

      router.push(`/projects/${project.id}`);
    } catch (error) {
      handleError('Error finishing onboarding', error);
    }
  };

  const steps = [
    {
      instructions: `${description} Звучит хорошо?`,
      action: (
        <div className="not-prose flex items-center gap-4">
          <Button onClick={() => setStarted(true)}>Отлично!</Button>
          <Button variant="outline" onClick={handleFinishWelcome}>
            Пропустить вводное
          </Button>
        </div>
      ),
      complete: started,
    },
    {
      instructions: (
        <>
          Прежде чем начать, необходимо оформить план Hobby, чтобы получить
          бесплатные AI-кредиты. Нажмите кнопку ниже, чтобы забрать кредиты.
          Это займёт несколько секунд и не требует банковской карты.
        </>
      ),
      action: (
        <div className="not-prose">
          <Button asChild>
            <Link href="/pricing">Забрать кредиты</Link>
          </Button>
        </div>
      ),
      complete: isSubscribed || plan === 'hobby',
    },
    {
      instructions: (
        <>
          Сначала нажмите значок{' '}
          <TextNode.icon className="-translate-y-0.5 inline-block size-4 text-primary" />{' '}
          на нижней панели инструментов. Это добавит узел Text на холст.
        </>
      ),
      complete: hasTextNode,
    },
    {
      instructions: (
        <>
          Отлично! Это первый узел. Поскольку у него нет входящих связей,
          содержание контролируете вы. Попробуйте написать несколько слов или
          предложений в узле. Наш любимый вариант — «a wild field of delphiniums».
        </>
      ),
      complete: hasTextNode && hasFilledTextNode,
    },
    {
      instructions: (
        <>
          Отличная работа! Теперь подключим его к узлу Image. Перетащите ручку
          справа от узла Text в пустое пространство и отпустите. Вас попросят
          выбрать тип узла. Выберите узел Image.
        </>
      ),
      complete:
        hasTextNode &&
        hasFilledTextNode &&
        hasImageNode &&
        hasConnectedImageNode,
    },
    {
      instructions: (
        <>
          Вы уже поняли принцип! Поскольку к этому узлу подключены входящие
          связи, он будет генерировать контент с помощью ИИ на основе входных
          узлов.
          <br />
          <br />
          Вы также можете добавить инструкции к узлу Image. Они будут влиять на
          результат. Попробуйте добавить инструкции к узлу Image, например:
          «сделай в стиле аниме».
        </>
      ),
      complete:
        hasTextNode &&
        hasFilledTextNode &&
        hasImageNode &&
        hasConnectedImageNode &&
        hasImageInstructions,
    },
    {
      instructions: (
        <>
          Этой информации достаточно, чтобы сгенерировать классное изображение!
          Нажмите на узел Image, чтобы выбрать его, затем нажмите кнопку{' '}
          <PlayIcon className="-translate-y-0.5 inline-block size-4 text-primary" />{' '}
          чтобы запустить генерацию.
        </>
      ),
      complete:
        hasTextNode &&
        hasFilledTextNode &&
        hasImageNode &&
        hasConnectedImageNode &&
        hasImageInstructions &&
        hasGeneratedImage,
    },
    {
      instructions: (
        <>
          Готово! Вы создали свой первый рабочий процесс на базе ИИ. Можете
          продолжать добавлять узлы на холст, строить более сложные потоки и
          раскрывать возможности Crafty.
        </>
      ),
      action: (
        <div className="not-prose">
          <Button asChild onClick={handleFinishWelcome}>
            <Link href="/">Продолжить</Link>
          </Button>
        </div>
      ),
      complete: false,
    },
  ];

  const activeStep = steps.find((step) => !step.complete) ?? steps[0];
  const previousSteps = steps.slice(0, steps.indexOf(activeStep));

  // biome-ignore lint/correctness/useExhaustiveDependencies: "we want to listen to activeStep"
  useEffect(() => {
    if (stepsContainerRef.current) {
      stepsContainerRef.current.scrollTo({
        top: stepsContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [activeStep.instructions]);

  const handleNodesChange = useCallback(() => {
    setTimeout(() => {
      const newEdges = getEdges();
      const newNodes = getNodes();

      const textNodes = newNodes.filter((node) => node.type === 'text');

      if (!textNodes.length) {
        setHasTextNode(false);
        return;
      }

      setHasTextNode(true);

      const textNode = textNodes.at(0);

      if (!textNode) {
        return;
      }

      const text = (textNode as unknown as TextNodeProps).data.text;

      if (text && text.length > 10) {
        setHasFilledTextNode(true);
      } else {
        setHasFilledTextNode(false);
      }

      const imageNodes = newNodes.filter((node) => node.type === 'image');
      const imageNode = imageNodes.at(0);

      if (!imageNode) {
        setHasImageNode(false);
        return;
      }

      setHasImageNode(true);

      const sources = getIncomers(imageNode, newNodes, newEdges);
      const textSource = sources.find((source) => source.id === textNode.id);

      if (!textSource) {
        setHasConnectedImageNode(false);
        return;
      }

      setHasConnectedImageNode(true);

      const image = imageNode as unknown as ImageNodeProps;
      const instructions = image.data.instructions;

      if (instructions && instructions.length > 5) {
        setHasImageInstructions(true);
      } else {
        setHasImageInstructions(false);
      }

      if (!image.data.generated?.url) {
        setHasGeneratedImage(false);
        return;
      }

      setHasGeneratedImage(true);
    }, 50);
  }, [getNodes, getEdges]);

  return (
    <div className="grid h-screen w-screen grid-rows-3 lg:grid-cols-3 lg:grid-rows-1">
      <div
        className="size-full overflow-auto p-8 lg:p-16"
        ref={stepsContainerRef}
      >
        <div className="prose flex flex-col items-start gap-4">
          <h1 className="font-semibold! text-3xl!">{title}</h1>
          {previousSteps.map((step, index) => (
            <p key={index} className="lead opacity-50">
              {step.instructions}
            </p>
          ))}

          <p className="lead">{activeStep?.instructions}</p>
          {activeStep?.action}
        </div>
      </div>
      <div className="row-span-3 p-8 lg:col-span-2 lg:row-span-1">
        <div className="relative size-full overflow-hidden rounded-3xl border">
          <Canvas onNodesChange={handleNodesChange}>
            {steps[0].complete && <Toolbar />}
          </Canvas>
        </div>
      </div>
    </div>
  );
};
