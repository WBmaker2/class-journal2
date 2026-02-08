import { useState } from 'react'
import { LayoutDashboard, ClipboardCheck, BookOpen, Clock, Settings } from 'lucide-react'
import { AttendanceTracker } from './features/AttendanceTracker'
import { ClassLogEditor } from './features/ClassLogEditor'
import { TimetableManager } from './features/TimetableManager'
import { Dashboard } from './features/Dashboard'
import { SettingsManager } from './features/SettingsManager'

type Tab = 'dashboard' | 'attendance' | 'timetable' | 'logs' | 'settings';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  const navItems = [
    { id: 'dashboard', label: '대시보드', icon: LayoutDashboard },
    { id: 'attendance', label: '출결 관리', icon: ClipboardCheck },
    { id: 'timetable', label: '시간표 기록', icon: Clock },
    { id: 'logs', label: '학급 일지', icon: BookOpen },
    { id: 'settings', label: '설정', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar (Desktop) */}
      <aside className="w-full md:w-64 bg-white border-b md:border-r border-gray-200 p-4 space-y-2 hidden md:block">
        <div className="mb-8 px-2">
          <h1 className="text-xl font-bold text-blue-600 flex items-center gap-2">
            <BookOpen size={24} />
            학급 일지
          </h1>
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as Tab)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === item.id 
                  ? 'bg-blue-50 text-blue-600' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <item.icon size={20} />
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <header className="mb-8 flex items-center justify-between md:hidden">
           <h1 className="text-xl font-bold text-blue-600">학급 일지</h1>
        </header>

        <div className="max-w-4xl mx-auto">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'attendance' && <AttendanceTracker />}
          {activeTab === 'timetable' && <TimetableManager />}
          {activeTab === 'logs' && <ClassLogEditor />}
          {activeTab === 'settings' && <SettingsManager />}
        </div>
      </main>

      {/* Bottom Nav (Mobile) */}
      <nav className="md:hidden bg-white border-t border-gray-200 flex justify-around p-2 sticky bottom-0">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as Tab)}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
              activeTab === item.id ? 'text-blue-600' : 'text-gray-400'
            }`}
          >
            <item.icon size={20} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}

export default App
