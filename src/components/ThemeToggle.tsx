"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function ModeToggle() {
    const { theme, setTheme } = useTheme()
    const [rotating, setRotating] = React.useState(false)
    const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

    const handleClick = () => {
        setRotating(true)
        const nextTheme = theme === "dark" ? "light" : "dark"
        timeoutRef.current = setTimeout(() => {
            setTheme(nextTheme)
            setRotating(false)
        }, 400)
    }

    React.useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current)
        }
    }, [])

    const isDark = theme === "dark"

    return (
        <Button
            variant="outline"
            size="icon"
            onClick={handleClick}
            className="shrink-0"
            aria-label="Toggle theme"
        >
            <span
                className={cn(
                    "inline-flex items-center justify-center transition-transform duration-[400ms] ease-out",
                    rotating && "rotate-[360deg]"
                )}
            >
                {isDark ? (
                    <Moon className="h-[1.2rem] w-[1.2rem]" />
                ) : (
                    <Sun className="h-[1.2rem] w-[1.2rem]" />
                )}
            </span>
        </Button>
    )
}
