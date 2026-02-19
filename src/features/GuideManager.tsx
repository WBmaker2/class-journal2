import React from 'react';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { 
  ShieldAlert, 
  Code, 
  Lock, 
  Globe, 
  FileJson, 
  Settings as SettingsIcon, 
  ClipboardCheck, 
  Clock, 
  BookOpen, 
  Users, 
  LayoutDashboard, 
  Calendar, 
  CheckCircle, 
  Mail,
  Info
} from 'lucide-react';

export const GuideManager: React.FC = () => {
  const guideItems = [
    {
      icon: <ShieldAlert className="text-red-500" />,
      text: "개인정보보호를 최우선으로 생각해주세요."
    },
    {
      icon: <Code className="text-blue-500" />,
      text: "바이브 코딩으로 만든 웹앱입니다. 개인적으로 사용하려고 제작했으나 필요하신 분은 자유롭게 사용하셔도 됩니다."
    },
    {
      icon: <Lock className="text-indigo-500" />,
      text: "구글 로그인을 통해서 클라우드 백업을 하실 때 비밀번호를 입력하셔야 합니다. 그러면 데이터가 암호화되어 백업되고, DB관리자인 저도 데이터를 읽을 수 없습니다.
※ 암호화 비밀번호를 꼭 기억해주세요."
    },
    {
      icon: <Globe className="text-green-500" />,
      text: "클라우드 백업은 필수가 아닙니다. 선택사항입니다. 기본적으로 로컬 브라우저에 데이터가 저장됩니다. 그러므로 여러사람이 함께 사용하는 공용PC에서는 일지를 실행하지 마세요. 로컬 데이터를 지우고 싶으시면 브라우저의 '인터넷 사용 기록 삭제'를 실행하시면 됩니다. ('인터넷 사용 기록 삭제'를 하지 않으면 데이터는 지워지지 않습니다.)"
    },
    {
      icon: <FileJson className="text-orange-500" />,
      text: "PC에 JSON파일로 백업 하고 싶으시면 'PC 로컬 백업/복구'기능을 이용해 주세요. 백업한 파일로 복구하는 것도 가능합니다. 이때도 개인정보보호를 최우선으로 생각해주세요."
    },
    {
      icon: <SettingsIcon className="text-gray-500" />,
      text: "설정 페이지에서 학급을 추가, 수정, 삭제하실 수 있고, 과목도 추가, 수정, 삭제 하실 수 있습니다."
    },
    {
      icon: <ClipboardCheck className="text-blue-600" />,
      text: "출결 관리에서는 날씨, 분위기, 출결을 기록하실 수 있고, '학생 관리' 기능을 통하여 학생을 등록, 수정, 삭제 하실 수 있습니다."
    },
    {
      icon: <Clock className="text-amber-500" />,
      text: "오늘의 수업에서는 각 차시의 수업 과목과 내용을 간단하게 기록하실 수 있습니다."
    },
    {
      icon: <BookOpen className="text-emerald-600" />,
      text: "학급 일지에서는 전반적인 내용을 줄글로 입력하실 수 있습니다. 입력하신 내용은 기간을 설정하여 엑셀파일, PDF파일로 다운로드 하실 수 있습니다."
    },
    {
      icon: <Users className="text-purple-500" />,
      text: "학생별 누가기록을 입력하실 수 있습니다. 입력하신 내용은 기간을 설정하여 엑셀파일, PDF파일로 다운로드 하실 수 있습니다."
    },
    {
      icon: <LayoutDashboard className="text-cyan-500" />,
      text: "대시보드에서는 각 종 통계자료를 보실 수 있고, 할 일 목록(To Do List)기능을 사용하실 수 있습니다."
    },
    {
      icon: <Calendar className="text-rose-500" />,
      text: "학급 시간표 관리에서는 각 학반별 시간표를 입력, 저장하실 수 있습니다. 입력하신 시간표는 '오늘의 수업'에 자동 적용됩니다."
    },
    {
      icon: <CheckCircle className="text-teal-500" />,
      text: "위 입력 내용은 모두 선택적입니다. 필수가 아닙니다. 그날 상황에 따라 입력하고 싶으신 내용만 입력하시면 됩니다."
    },
    {
      icon: <Info className="text-gray-400" />,
      text: "수익을 목적으로 한 프로그램이 아닙니다. 개인 프로젝트이고 저는 개발자가 아니기 때문에 오류가 있을 수 있습니다. 격려의 말씀, 기능개선 건의 등은 아래의 이메일 주소로 보내주시기 바랍니다."
    }
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader 
          title="사용 안내" 
          subtitle="우리 반 학급일지를 더 효과적이고 안전하게 사용하는 방법" 
        />
        <CardContent>
          <div className="grid grid-cols-1 gap-4">
            {guideItems.map((item, index) => (
              <div key={index} className="flex gap-4 p-4 rounded-xl border border-gray-100 bg-white hover:bg-gray-50 transition-colors shadow-sm">
                <div className="flex-shrink-0 mt-1">
                  {item.icon}
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">Step {index + 1}</span>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line font-medium">
                    {item.text}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 p-6 bg-blue-50 rounded-2xl border border-blue-100 flex flex-col items-center text-center space-y-3">
            <div className="bg-blue-600 p-2 rounded-full text-white">
              <Mail size={20} />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-blue-900">도움이 필요하거나 제안사항이 있으신가요?</p>
              <p className="text-lg font-black text-blue-600">vibehong@gmail.com</p>
            </div>
            <p className="text-xs text-blue-400">언제든지 편하게 메일 보내주세요. 감사합니다!</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
