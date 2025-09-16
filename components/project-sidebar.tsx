"use client"

import type { ReactNode } from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarInset,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { ProjectChat } from "@/components/project-chat"

type ProjectSidebarLayoutProps = {
  projectId: string
  children: ReactNode
}

export const ProjectSidebarLayout = ({ projectId, children }: ProjectSidebarLayoutProps) => {
  return (
    <SidebarProvider>
      <Sidebar variant="floating" collapsible="offcanvas" className="border-transparent">
        <SidebarContent className="p-0">
          <ProjectChat projectId={projectId} />
        </SidebarContent>
        <SidebarRail />
      </Sidebar>
      <SidebarInset className="relative">
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}


