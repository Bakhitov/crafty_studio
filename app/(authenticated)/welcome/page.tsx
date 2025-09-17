import { createProjectAction } from '@/app/actions/project/create';
import { currentUser } from '@/lib/auth';
import { database } from '@/lib/database';
import { ProjectProvider } from '@/providers/project';
import { projects } from '@/schema';
import { and, eq } from 'drizzle-orm';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { WelcomeDemo } from './components/welcome-demo';

const title = 'Добро пожаловать в Crafty studio!';
const description =
  'Crafty — платформа для создания контента на базе ИИ. Давайте начнём и вместе создадим первый воркфлоу.';

export const metadata: Metadata = {
  title,
  description,
};

const Welcome = async () => {
  const user = await currentUser();

  if (!user) {
    return redirect('/sign-in');
  }

  let welcomeProject = await database.query.projects.findFirst({
    where: and(eq(projects.userId, user.id), eq(projects.welcomeProject, true)),
  });

  if (!welcomeProject) {
    const response = await createProjectAction('Добро пожаловать', true);

    if ('error' in response) {
      return <div>Ошибка: {response.error}</div>;
    }

    const project = await database.query.projects.findFirst({
      where: eq(projects.id, response.id),
    });

    welcomeProject = project;
  }

  if (!welcomeProject) {
    throw new Error('Не удалось создать приветственный проект');
  }

  return (
    <div className="flex flex-col gap-4">
      <ProjectProvider data={welcomeProject}>
        <WelcomeDemo title={title} description={description} />
      </ProjectProvider>
    </div>
  );
};

export default Welcome;
