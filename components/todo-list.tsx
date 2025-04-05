"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Trash2 } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import type { Task } from "@/lib/types"

export default function TodoList() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [newTaskText, setNewTaskText] = useState("")
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  // Check for user session and load tasks
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

  // Load tasks when user changes
  useEffect(() => {
    if (user) {
      fetchTasks()
    } else {
      // If no user, load from localStorage
      const savedTasks = localStorage.getItem("productivityHubTasks")
      if (savedTasks) {
        try {
          setTasks(JSON.parse(savedTasks))
        } catch (e) {
          console.error("Failed to parse saved tasks", e)
        }
      }
      setLoading(false)
    }
  }, [user])

  // Save tasks to localStorage when they change (for non-authenticated users)
  useEffect(() => {
    if (!user && tasks.length >= 0) {
      localStorage.setItem("productivityHubTasks", JSON.stringify(tasks))
    }
  }, [tasks, user])

  // Fetch tasks from Supabase
  const fetchTasks = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.from("tasks").select("*").order("created_at", { ascending: false })

      if (error) throw error

      if (data) setTasks(data)
    } catch (error) {
      console.error("Error fetching tasks:", error)
    } finally {
      setLoading(false)
    }
  }

  // Add a new task
  const addTask = async () => {
    if (newTaskText.trim() === "") return

    if (user) {
      try {
        const newTask = {
          user_id: user.id,
          text: newTaskText,
          completed: false,
        }

        const { data, error } = await supabase.from("tasks").insert([newTask]).select()

        if (error) throw error

        if (data) {
          setTasks([...data, ...tasks])
        }
      } catch (error) {
        console.error("Error adding task:", error)
      }
    } else {
      // For non-authenticated users, use localStorage
      const newTask = {
        id: Date.now().toString(),
        user_id: "local",
        text: newTaskText,
        completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      setTasks([newTask, ...tasks])
    }

    setNewTaskText("")
  }

  // Toggle task completion
  const toggleTaskCompletion = async (id: string, currentStatus: boolean) => {
    if (user) {
      try {
        const { error } = await supabase
          .from("tasks")
          .update({ completed: !currentStatus, updated_at: new Date().toISOString() })
          .eq("id", id)

        if (error) throw error

        setTasks(tasks.map((task) => (task.id === id ? { ...task, completed: !currentStatus } : task)))
      } catch (error) {
        console.error("Error updating task:", error)
      }
    } else {
      // For non-authenticated users
      setTasks(tasks.map((task) => (task.id === id ? { ...task, completed: !currentStatus } : task)))
    }
  }

  // Remove a task
  const removeTask = async (id: string) => {
    if (user) {
      try {
        const { error } = await supabase.from("tasks").delete().eq("id", id)

        if (error) throw error

        setTasks(tasks.filter((task) => task.id !== id))
      } catch (error) {
        console.error("Error removing task:", error)
      }
    } else {
      // For non-authenticated users
      setTasks(tasks.filter((task) => task.id !== id))
    }
  }

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    addTask()
  }

  if (loading) {
    return <div className="flex justify-center p-4">Loading tasks...</div>
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex space-x-2 mb-4">
        <Input
          type="text"
          placeholder="Add a new task..."
          value={newTaskText}
          onChange={(e) => setNewTaskText(e.target.value)}
          className="flex-1"
        />
        <Button type="submit">Add</Button>
      </form>

      <div className="space-y-2">
        {tasks.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No tasks yet. Add one above!</p>
        ) : (
          tasks.map((task) => (
            <div key={task.id} className="flex items-center justify-between p-3 border rounded-md">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id={`task-${task.id}`}
                  checked={task.completed}
                  onCheckedChange={() => toggleTaskCompletion(task.id, task.completed)}
                />
                <label htmlFor={`task-${task.id}`} className={`${task.completed ? "line-through text-gray-500" : ""}`}>
                  {task.text}
                </label>
              </div>
              <Button variant="ghost" size="icon" onClick={() => removeTask(task.id)} aria-label="Remove task">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

