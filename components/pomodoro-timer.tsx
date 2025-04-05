"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { supabase } from "@/lib/supabase/client"
import type { PomodoroSettings } from "@/lib/types"

type TimerMode = "work" | "shortBreak" | "longBreak"

const DEFAULT_SETTINGS = {
  work_duration: 25 * 60, // 25 minutes in seconds
  short_break_duration: 5 * 60, // 5 minutes in seconds
  long_break_duration: 15 * 60, // 15 minutes in seconds
  sessions_until_long_break: 4,
}

export default function PomodoroTimer() {
  const [timeLeft, setTimeLeft] = useState(DEFAULT_SETTINGS.work_duration)
  const [isActive, setIsActive] = useState(false)
  const [mode, setMode] = useState<TimerMode>("work")
  const [completedSessions, setCompletedSessions] = useState(0)
  const [settings, setSettings] = useState<PomodoroSettings | null>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Get current settings based on user or defaults
  const currentSettings = settings || DEFAULT_SETTINGS
  const totalTime =
    mode === "work"
      ? currentSettings.work_duration
      : mode === "shortBreak"
        ? currentSettings.short_break_duration
        : currentSettings.long_break_duration

  const progress = ((totalTime - timeLeft) / totalTime) * 100

  // Check for user session and load settings
  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
    }

    fetchUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Load settings when user changes
  useEffect(() => {
    if (user) {
      fetchSettings()
    } else {
      // If no user, try to load from localStorage
      const savedSettings = localStorage.getItem("productivityHubPomodoroSettings")
      if (savedSettings) {
        try {
          setSettings(JSON.parse(savedSettings))
        } catch (e) {
          console.error("Failed to parse saved settings", e)
        }
      }
      setLoading(false)
    }
  }, [user])

  // Fetch settings from Supabase
  const fetchSettings = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.from("pomodoro_settings").select("*").eq("user_id", user.id).single()

      if (error && error.code !== "PGRST116") {
        // PGRST116 is "no rows returned"
        throw error
      }

      if (data) {
        setSettings(data)
      } else {
        // Create default settings for the user
        const { data: newSettings, error: insertError } = await supabase
          .from("pomodoro_settings")
          .insert([
            {
              user_id: user.id,
              ...DEFAULT_SETTINGS,
            },
          ])
          .select()

        if (insertError) throw insertError

        if (newSettings && newSettings.length > 0) {
          setSettings(newSettings[0])
        }
      }
    } catch (error) {
      console.error("Error fetching settings:", error)
    } finally {
      setLoading(false)
    }
  }

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // Handle timer completion
  const handleTimerComplete = () => {
    // Play notification sound
    const audio = new Audio("/notification.mp3")
    audio.play().catch((e) => console.log("Audio play failed:", e))

    if (mode === "work") {
      const newCompletedSessions = completedSessions + 1
      setCompletedSessions(newCompletedSessions)

      // After X work sessions, take a long break
      if (newCompletedSessions % currentSettings.sessions_until_long_break === 0) {
        setMode("longBreak")
        setTimeLeft(currentSettings.long_break_duration)
      } else {
        setMode("shortBreak")
        setTimeLeft(currentSettings.short_break_duration)
      }
    } else {
      // After a break, go back to work mode
      setMode("work")
      setTimeLeft(currentSettings.work_duration)
    }

    setIsActive(false)
  }

  // Timer effect
  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(timerRef.current as NodeJS.Timeout)
            handleTimerComplete()
            return 0
          }
          return prevTime - 1
        })
      }, 1000)
    } else if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isActive])

  // Update timeLeft when mode changes
  useEffect(() => {
    if (!isActive) {
      if (mode === "work") {
        setTimeLeft(currentSettings.work_duration)
      } else if (mode === "shortBreak") {
        setTimeLeft(currentSettings.short_break_duration)
      } else {
        setTimeLeft(currentSettings.long_break_duration)
      }
    }
  }, [mode, settings])

  // Toggle timer
  const toggleTimer = () => {
    setIsActive(!isActive)
  }

  // Reset timer
  const resetTimer = () => {
    setIsActive(false)
    if (mode === "work") {
      setTimeLeft(currentSettings.work_duration)
    } else if (mode === "shortBreak") {
      setTimeLeft(currentSettings.short_break_duration)
    } else {
      setTimeLeft(currentSettings.long_break_duration)
    }
  }

  if (loading) {
    return <div className="flex justify-center p-4">Loading timer...</div>
  }

  return (
    <Card className="p-6">
      <div className="flex flex-col items-center">
        <div className="text-6xl font-mono font-bold mb-6">{formatTime(timeLeft)}</div>

        <Progress value={progress} className="w-full h-2 mb-6" />

        <div className="text-sm font-medium text-gray-500 mb-4">
          Mode:{" "}
          <span className="font-semibold">
            {mode === "work" ? "Work" : mode === "shortBreak" ? "Short Break" : "Long Break"}
          </span>
        </div>

        <div className="flex space-x-4">
          <Button onClick={toggleTimer} variant={isActive ? "destructive" : "default"}>
            {isActive ? "Pause" : "Start"}
          </Button>
          <Button onClick={resetTimer} variant="outline">
            Reset
          </Button>
        </div>
      </div>
    </Card>
  )
}

