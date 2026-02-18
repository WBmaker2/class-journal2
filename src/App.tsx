import { useState } from 'react'
import { LayoutDashboard, ClipboardCheck, BookOpen, Clock, Settings, Calendar, Users } from 'lucide-react'
import { AttendanceTracker } from './features/AttendanceTracker'
import { ClassLogEditor } from './features/ClassLogEditor'
import { LessonLogManager } from './features/LessonLogManager'
import { TimetableManager } from './features/TimetableManager'
import { StudentCumulativeRecord } from './features/StudentCumulativeRecord'
import { Dashboard } from './features/Dashboard'
import { SettingsManager } from './features/SettingsManager'
import { useJournal } from './context/JournalContext'
import { SyncStatusIndicator } from './components/SyncStatusIndicator'
import { ClassSelector } from './components/ClassSelector'
import { SecurityKeyModal } from './components/ui/SecurityKeyModal'

type Tab = 'dashboard' | 'attendance' | 'timetable' | 'class-timetable' | 'logs' | 'settings' | 'student-records';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('attendance');
  const { currentDate, setCurrentDate } = useJournal();

  const navItems = [
    { id: 'attendance', label: '출결 관리', icon: ClipboardCheck },
    { id: 'timetable', label: '오늘의 수업', icon: Clock },
    { id: 'class-timetable', label: '학급 시간표', icon: Calendar },
    { id: 'logs', label: '학급 일지', icon: BookOpen },
    { id: 'student-records', label: '학생별 누가기록', icon: Users },
    { id: 'dashboard', label: '대시보드', icon: LayoutDashboard },
    { id: 'settings', label: '설정', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <SecurityKeyModal />
      {/* Sidebar (Desktop) */}
      <aside className="w-full md:w-64 bg-white border-b md:border-r border-gray-200 p-4 space-y-2 hidden md:block flex-shrink-0">
        <div className="mb-8 px-2">
          <h1 className="text-lg font-bold text-blue-600 flex items-center gap-2">
            <BookOpen size={24} />
            우리 반 학급 일지 <span className="text-xs font-normal text-gray-400">v3.1</span>
          </h1>
          <div className="mt-2">
            <SyncStatusIndicator />
          </div>
        </div>
        
        {/* Global Date Picker (Desktop) */}
        <div className="mb-6 px-2">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">
            기준 날짜
          </label>
          <div className="relative">
            <input 
              type="date" 
              value={currentDate}
              onChange={(e) => setCurrentDate(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border pl-9"
            />
            <Clock className="absolute left-2.5 top-2.5 text-gray-400" size={16} />
          </div>
        </div>
        
        <ClassSelector />

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
      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-screen">
        {/* Mobile Header */}
        <header className="mb-6 md:hidden space-y-4">
           <div className="flex items-center justify-between">
             <h1 className="text-lg font-bold text-blue-600 flex items-center gap-2">
               <BookOpen size={24} />
               우리 반 학급 일지 <span className="text-xs font-normal text-gray-400">v3.1</span>
             </h1>
             <SyncStatusIndicator />
           </div>
           
           {/* Global Date Picker (Mobile) */}
           <div className="relative">
             <input 
               type="date" 
               value={currentDate}
               onChange={(e) => setCurrentDate(e.target.value)}
               className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-2 border pl-9"
             />
             <Clock className="absolute left-2.5 top-2.5 text-gray-400" size={16} />
           </div>
        </header>

        <div className="max-w-4xl mx-auto pb-20 md:pb-0">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'attendance' && <AttendanceTracker />}
          {activeTab === 'timetable' && <LessonLogManager />}
          {activeTab === 'class-timetable' && <TimetableManager />}
          {activeTab === 'logs' && <ClassLogEditor />}
          {activeTab === 'student-records' && <StudentCumulativeRecord />}
          {activeTab === 'settings' && <SettingsManager />}
        </div>
      </main>

      {/* Bottom Nav (Mobile) */}
      <nav className="md:hidden bg-white border-t border-gray-200 flex justify-around p-2 fixed bottom-0 left-0 right-0 z-10">
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