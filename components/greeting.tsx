"use client"

import React from "react"

export const Greeting: React.FC = () => {
  return (
    <div className="flex h-full w-full items-center justify-center px-4 py-6">
      <div className="text-center text-sm text-muted-foreground">
        Добро пожаловать! Начните диалог — задайте вопрос или опишите задачу.
      </div>
    </div>
  )
}

export default Greeting

