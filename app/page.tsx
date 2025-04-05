import PomodoroTimer from "@/components/pomodoro-timer"
import TodoList from "@/components/todo-list"
import StudySpotMap from "@/components/study-spot-map"
import UserAuthForm from "@/components/auth/user-auth-form"

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Productivity Hub</h1>
          <UserAuthForm />
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Pomodoro Timer</h2>
              <PomodoroTimer />
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Tasks</h2>
              <TodoList />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Find Study Spots (Singapore)</h2>
            <StudySpotMap />
          </div>
        </div>
      </div>
    </main>
  )
}

