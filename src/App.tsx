// Version: v3.9.11
import { useState } from 'react'
import { LayoutDashboard, ClipboardCheck, BookOpen, Clock, Settings, Calendar, Users, Info } from 'lucide-react'
import { AttendanceTracker } from './features/AttendanceTracker'
import { ClassLogEditor } from './features/ClassLogEditor'
import { LessonLogManager } from './features/LessonLogManager'
import { TimetableManager } from './features/TimetableManager'
import { StudentCumulativeRecord } from './features/StudentCumulativeRecord'
import { Dashboard } from './features/Dashboard'
import { SettingsManager } from './features/SettingsManager'
import { GuideManager } from './features/GuideManager'
import { useJournal } from './context/JournalContext'
import { SyncStatusIndicator } from './components/SyncStatusIndicator'
import { ClassSelector } from './components/ClassSelector'
import { SecurityKeyModal } from './components/ui/SecurityKeyModal'

type Tab = 'dashboard' | 'attendance' | 'timetable' | 'class-timetable' | 'logs' | 'settings' | 'student-records' | 'guide';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('attendance');
  const { currentDate, setCurrentDate } = useJournal();

  const navItems = [
    { id: 'attendance', label: '출결 관리', icon: ClipboardCheck },
    { id: 'timetable', label: '오늘의 수업', icon: Clock },
    { id: 'logs', label: '학급 일지', icon: BookOpen },
    { id: 'student-records', label: '학생별 누가기록', icon: Users },
    { id: 'dashboard', label: '대시보드', icon: LayoutDashboard },
    { id: 'class-timetable', label: '학급 시간표 관리', icon: Calendar },
    { id: 'settings', label: '설정', icon: Settings },
    { id: 'guide', label: '사용 안내', icon: Info },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <SecurityKeyModal />
      {/* Sidebar (Desktop) */}
      <aside className="w-full md:w-64 lg:w-72 bg-white border-b md:border-r border-gray-200 p-4 space-y-2 hidden md:block flex-shrink-0 overflow-y-auto md:h-screen sticky top-0">
        <div className="mb-8 pl-2 pr-0">
          <h1 className="text-lg lg:text-xl font-bold text-blue-600 flex items-center gap-1.5 whitespace-nowrap">
            <BookOpen size={24} className="flex-shrink-0" />
            우리 반 학급일지 <span className="text-[10px] font-normal text-gray-400 ml-1">v3.9.11</span>
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
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === item.id 
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-100' 
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <item.icon size={20} />
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-2 md:p-6 lg:p-8 xl:p-12 bg-slate-50/50">
        {/* Mobile Header */}
        <header className="mb-4 md:hidden space-y-3 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
           <div className="flex items-center justify-between gap-2">
             <h1 className="text-base font-bold text-blue-600 flex items-center gap-1.5 min-w-0">
               <BookOpen size={20} className="flex-shrink-0" />
               <span className="truncate">우리 반 학급일지</span>
               <span className="text-[10px] font-normal text-gray-400 flex-shrink-0">v3.9.11</span>
             </h1>
             <div className="flex-shrink-0">
               <SyncStatusIndicator />
             </div>
           </div>
           
           <ClassSelector />
           
           {/* Global Date Picker (Mobile) */}
           <div className="relative">
             <input 
               type="date" 
               value={currentDate}
               onChange={(e) => setCurrentDate(e.target.value)}
               className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-1.5 border pl-9"
             />
             <Clock className="absolute left-2.5 top-2.5 text-gray-400" size={16} />
           </div>
        </header>

        <div className="max-w-[1600px] mx-auto pb-24 md:pb-0 px-1 md:px-0">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'attendance' && <AttendanceTracker />}
          {activeTab === 'timetable' && <LessonLogManager />}
          {activeTab === 'class-timetable' && <TimetableManager />}
          {activeTab === 'logs' && <ClassLogEditor />}
          {activeTab === 'student-records' && <StudentCumulativeRecord />}
          {activeTab === 'settings' && <SettingsManager />}
          {activeTab === 'guide' && <GuideManager />}
        </div>
      </main>

      {/* Bottom Nav (Mobile) - Optimized with scroll if items overflow */}
      <nav className="md:hidden bg-white border-t border-gray-200 flex overflow-x-auto p-1 fixed bottom-0 left-0 right-0 z-10 scrollbar-hide">
        <div className="flex min-w-full justify-around">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as Tab)}
              className={`flex flex-col items-center gap-1 p-1.5 rounded-lg transition-colors flex-shrink-0 min-w-[64px] ${
                activeTab === item.id ? 'text-blue-600' : 'text-gray-400'
              }`}
            >
              <item.icon size={20} />
              <span className="text-[10px] font-medium whitespace-nowrap">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}

export default App
